import os
import json
import re

import google.generativeai as genai
from dotenv import load_dotenv


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured in the .env file."
    )

genai.configure(api_key=GEMINI_API_KEY)


# =========================================================
# SERVICES
# =========================================================

VALID_SERVICES = {
    "Plumbing",
    "Electrical",
    "Carpentry",
    "AC Repair",
    "Appliance Repair",
    "Painting",
    "Cleaning",
    "Pest Control",
    "INVALID"
}


# =========================================================
# SIMPLE CACHE
# =========================================================

# Stores previously detected problems during the current
# backend session so repeated requests don't call Gemini.
service_cache = {}


# =========================================================
# GEMINI MODEL
# =========================================================

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction="""
You are NiborAid's household service classification assistant.

Your job is to identify the ONE most appropriate service needed
for a customer's household problem.

You MUST return valid JSON in exactly this format:

{
  "service": "SERVICE_NAME",
  "confidence": 0.0,
  "problem_type": "short description"
}

The service MUST be exactly one of:

Plumbing
Electrical
Carpentry
AC Repair
Appliance Repair
Painting
Cleaning
Pest Control
INVALID

Use INVALID when the input does not clearly describe a household
problem belonging to one of the available services.

==================================================
CLASSIFICATION RULES
==================================================

1. IDENTIFY THE OBJECT FIRST.

The object or equipment involved has priority over the symptom.

For example:

"My dishwasher is leaking"
→ Appliance Repair

"My washing machine is leaking"
→ Appliance Repair

"My refrigerator is leaking"
→ Appliance Repair

"My microwave is not working"
→ Appliance Repair

"My AC is leaking water"
→ AC Repair

"My pipe is leaking"
→ Plumbing

"My tap is leaking"
→ Plumbing

"My sink is leaking"
→ Plumbing

"My toilet is leaking"
→ Plumbing

Do NOT classify something as Plumbing simply because
the word "leaking" appears.

==================================================
EQUIPMENT PRIORITY
==================================================

If an appliance has a problem:
→ Appliance Repair

If an AC has a problem:
→ AC Repair

If a fan has a problem:
→ Electrical

If a light, switch, socket, wiring, circuit breaker,
or electrical connection has a problem:
→ Electrical

If a pipe, tap, sink, toilet, drain, faucet, or water
system has a problem:
→ Plumbing

If a door, chair, table, cupboard, cabinet, wooden item,
or furniture has a problem:
→ Carpentry

If walls, rooms, ceilings, or a house need painting:
→ Painting

If the house needs cleaning, dust removal, deep cleaning,
or similar cleaning work:
→ Cleaning

If insects, cockroaches, termites, ants, rats, mosquitoes,
or other pests are present:
→ Pest Control

==================================================
IMPORTANT DISTINCTIONS
==================================================

A fan is NOT an AC.

A refrigerator is NOT AC Repair.

A washing machine is NOT Plumbing just because it leaks.

A dishwasher is NOT Plumbing just because it leaks.

A microwave is NOT Electrical if the problem is specifically
with the appliance itself. Use Appliance Repair.

A door or chair is Carpentry, not a generic INVALID response.

==================================================
INVALID INPUTS
==================================================

Return INVALID when the input:

- is a greeting
- is unrelated to household services
- is nonsense
- is too vague
- does not identify a recognizable household problem
- asks for a job
- asks a general question
- refers to something unrelated to home services

Examples:

"Hello"
→ INVALID

"How are you?"
→ INVALID

"I need help"
→ INVALID

"I want a job"
→ INVALID

"abcdef"
→ INVALID

"My shop is not working"
→ INVALID

==================================================
EXAMPLES
==================================================

"Fan is not working"
→ Electrical

"Ceiling fan stopped suddenly"
→ Electrical

"AC is not cooling"
→ AC Repair

"My refrigerator is not working"
→ Appliance Repair

"My dishwasher is leaking"
→ Appliance Repair

"My washing machine is making noise"
→ Appliance Repair

"Water is leaking from my pipe"
→ Plumbing

"My tap is leaking"
→ Plumbing

"My door is broken"
→ Carpentry

"My chair is broken"
→ Carpentry

"I need my house painted"
→ Painting

"My house needs cleaning"
→ Cleaning

"There are cockroaches in my kitchen"
→ Pest Control

==================================================
CONFIDENCE
==================================================

Return confidence as a number between 0 and 1.

Use high confidence when the object and problem clearly
identify a service.

Use low confidence when the description is vague or ambiguous.

If the problem cannot confidently be mapped to one of the
available services, return INVALID.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Do not use Markdown.

Do not include explanations outside the JSON.

Do not return multiple services.
"""
)


# =========================================================
# FALLBACK DETECTOR
# =========================================================

def fallback_detect_service(problem: str):

    text = problem.lower().strip()

    # -----------------------------
    # INVALID / VAGUE INPUT
    # -----------------------------

    if not text:
        return {
            "service": "INVALID",
            "confidence": 0.0,
            "problem_type": "No problem description provided."
        }

    if text in {
        "hello",
        "hi",
        "hey",
        "how are you",
        "i need help",
        "help me",
        "abcdef",
        "i want a job"
    }:
        return {
            "service": "INVALID",
            "confidence": 0.0,
            "problem_type": "Input does not describe a household service problem."
        }

    # -----------------------------
    # APPLIANCES FIRST
    # -----------------------------

    appliances = [
        "refrigerator",
        "fridge",
        "washing machine",
        "washer",
        "dishwasher",
        "microwave",
        "oven"
    ]

    if any(word in text for word in appliances):
        return {
            "service": "Appliance Repair",
            "confidence": 0.90,
            "problem_type": "Problem with a household appliance."
        }

    # -----------------------------
    # AC
    # -----------------------------

    if re.search(
        r"\bac\b|\bair conditioner\b|\bair conditioning\b",
        text
    ):
        return {
            "service": "AC Repair",
            "confidence": 0.95,
            "problem_type": "Problem with an air conditioning system."
        }

    # -----------------------------
    # ELECTRICAL
    # -----------------------------

    electrical_words = [
        "fan",
        "light",
        "bulb",
        "switch",
        "socket",
        "wiring",
        "wire",
        "circuit breaker",
        "electricity",
        "power"
    ]

    if any(word in text for word in electrical_words):
        return {
            "service": "Electrical",
            "confidence": 0.90,
            "problem_type": "Electrical problem."
        }

    # -----------------------------
    # PLUMBING
    # -----------------------------

    plumbing_words = [
        "pipe",
        "tap",
        "sink",
        "toilet",
        "drain",
        "faucet",
        "water leak",
        "water leakage",
        "water coming",
        "plumbing"
    ]

    if any(word in text for word in plumbing_words):
        return {
            "service": "Plumbing",
            "confidence": 0.90,
            "problem_type": "Water or plumbing problem."
        }

    # -----------------------------
    # CARPENTRY
    # -----------------------------

    carpentry_words = [
        "door",
        "chair",
        "table",
        "cupboard",
        "cabinet",
        "wood",
        "wooden",
        "furniture"
    ]

    if any(word in text for word in carpentry_words):
        return {
            "service": "Carpentry",
            "confidence": 0.90,
            "problem_type": "Problem with furniture or wooden work."
        }

    # -----------------------------
    # PAINTING
    # -----------------------------

    painting_words = [
        "paint",
        "painting",
        "wall color",
        "repaint",
        "repainting"
    ]

    if any(word in text for word in painting_words):
        return {
            "service": "Painting",
            "confidence": 0.90,
            "problem_type": "Painting or repainting work required."
        }

    # -----------------------------
    # CLEANING
    # -----------------------------

    cleaning_words = [
        "clean",
        "cleaning",
        "dust",
        "deep cleaning",
        "dirty"
    ]

    if any(word in text for word in cleaning_words):
        return {
            "service": "Cleaning",
            "confidence": 0.85,
            "problem_type": "Cleaning service required."
        }

    # -----------------------------
    # PEST CONTROL
    # -----------------------------

    pest_words = [
        "cockroach",
        "cockroaches",
        "termite",
        "termites",
        "ants",
        "rat",
        "rats",
        "mosquito",
        "mosquitoes",
        "pest",
        "pests",
        "insects"
    ]

    if any(word in text for word in pest_words):
        return {
            "service": "Pest Control",
            "confidence": 0.90,
            "problem_type": "Pest problem detected."
        }

    # -----------------------------
    # UNKNOWN
    # -----------------------------

    return {
        "service": "INVALID",
        "confidence": 0.0,
        "problem_type": "Unable to classify the problem."
    }


# =========================================================
# NORMALIZE GEMINI RESULT
# =========================================================

def normalize_result(result):

    service = result.get("service", "INVALID")

    if service not in VALID_SERVICES:
        service = "INVALID"

    confidence = result.get("confidence", 0.0)

    try:
        confidence = float(confidence)
    except (TypeError, ValueError):
        confidence = 0.0

    confidence = max(
        0.0,
        min(1.0, confidence)
    )

    problem_type = result.get(
        "problem_type",
        "Unable to determine problem type."
    )

    return {
        "service": service,
        "confidence": confidence,
        "problem_type": str(problem_type)
    }


# =========================================================
# SERVICE DETECTION
# =========================================================

def detect_service(problem: str):

    if not problem or not problem.strip():
        return {
            "service": "INVALID",
            "confidence": 0.0,
            "problem_type": "No problem description provided."
        }

    cleaned_problem = problem.strip()
    cache_key = cleaned_problem.lower()

    # =====================================================
    # CHECK CACHE
    # =====================================================

    if cache_key in service_cache:

        print("Using cached AI result.")

        return service_cache[cache_key]

    # =====================================================
    # TRY GEMINI
    # =====================================================

    try:

        response = model.generate_content(
            cleaned_problem,
            generation_config={
                "temperature": 0,
                "response_mime_type": "application/json"
            },
            request_options={
                "timeout": 5
            }
        )

        raw_response = response.text.strip()

        result = json.loads(raw_response)

        final_result = normalize_result(result)

        # Save successful Gemini result
        service_cache[cache_key] = final_result

        return final_result

    # =====================================================
    # GEMINI FAILURE → FALLBACK
    # =====================================================

    except Exception as e:

        error_message = str(e)

        print(
            "Gemini service detection error:",
            error_message
        )

        # Use deterministic fallback
        fallback_result = fallback_detect_service(
            cleaned_problem
        )

        print(
            "Using fallback service detection:",
            fallback_result["service"]
        )

        # Cache fallback too, so repeated requests don't
        # repeatedly hit the exhausted Gemini quota.
        service_cache[cache_key] = fallback_result

        return fallback_result