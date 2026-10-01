from ai.service_detection import detect_service


# ============================================================
# 100 EDGE CASES
# ============================================================

test_cases = [

    # ---------------- PLUMBING ----------------
    ("My kitchen pipe is leaking", "Plumbing"),
    ("The bathroom tap is leaking", "Plumbing"),
    ("My sink is clogged", "Plumbing"),
    ("Water is coming out of my pipe", "Plumbing"),
    ("My toilet is blocked", "Plumbing"),
    ("The bathroom drain is blocked", "Plumbing"),
    ("My faucet is broken", "Plumbing"),
    ("There is a water leak under my sink", "Plumbing"),
    ("My toilet is overflowing", "Plumbing"),
    ("I have low water pressure in my house", "Plumbing"),
    ("The water pipe has burst", "Plumbing"),
    ("My kitchen tap has no water", "Plumbing"),
    ("Water is leaking from the bathroom wall", "Plumbing"),

    # ---------------- ELECTRICAL ----------------
    ("My fan is not working", "Electrical"),
    ("My ceiling fan stopped working", "Electrical"),
    ("The light in my bedroom is not working", "Electrical"),
    ("My switch is broken", "Electrical"),
    ("My socket is not working", "Electrical"),
    ("There is a wiring problem in my house", "Electrical"),
    ("The power keeps going off", "Electrical"),
    ("My lights are flickering", "Electrical"),
    ("The circuit breaker keeps tripping", "Electrical"),
    ("My doorbell is not working", "Electrical"),
    ("There is a short circuit", "Electrical"),
    ("I need electrical wiring for my house", "Electrical"),
    ("My ceiling light stopped working", "Electrical"),

    # ---------------- CARPENTRY ----------------
    ("My wooden door is broken", "Carpentry"),
    ("My chair is broken", "Carpentry"),
    ("My wooden table needs repair", "Carpentry"),
    ("My cupboard door is damaged", "Carpentry"),
    ("My wooden shelf is broken", "Carpentry"),
    ("I need a new wooden cabinet", "Carpentry"),
    ("My furniture needs repair", "Carpentry"),
    ("My door hinge is broken", "Carpentry"),
    ("My wooden bed is damaged", "Carpentry"),
    ("I need custom woodwork", "Carpentry"),
    ("My cabinet is falling apart", "Carpentry"),
    ("My wooden drawer is stuck", "Carpentry"),

    # ---------------- AC REPAIR ----------------
    ("My AC is not cooling", "AC Repair"),
    ("My air conditioner is not working", "AC Repair"),
    ("My AC is blowing hot air", "AC Repair"),
    ("My AC is leaking water", "AC Repair"),
    ("My AC is making a strange noise", "AC Repair"),
    ("My AC is not turning on", "AC Repair"),
    ("My air conditioner has poor airflow", "AC Repair"),
    ("My AC needs servicing", "AC Repair"),
    ("My AC remote is not working", "AC Repair"),
    ("My AC is making a loud sound", "AC Repair"),
    ("My air conditioner is not cooling the room", "AC Repair"),
    ("I need my AC repaired", "AC Repair"),

    # ---------------- APPLIANCE REPAIR ----------------
    ("My refrigerator is not working", "Appliance Repair"),
    ("My fridge is not cooling", "Appliance Repair"),
    ("My washing machine is broken", "Appliance Repair"),
    ("My washing machine is not spinning", "Appliance Repair"),
    ("My microwave is not heating", "Appliance Repair"),
    ("My dishwasher is leaking", "Appliance Repair"),
    ("My dishwasher is not working", "Appliance Repair"),
    ("My refrigerator is making a strange noise", "Appliance Repair"),
    ("My washing machine is leaking water", "Appliance Repair"),
    ("My microwave is broken", "Appliance Repair"),
    ("My fridge is making noise", "Appliance Repair"),
    ("My washing machine won't start", "Appliance Repair"),
    ("My refrigerator has stopped working", "Appliance Repair"),

    # ---------------- PAINTING ----------------
    ("I need my walls painted", "Painting"),
    ("My bedroom needs painting", "Painting"),
    ("I want to repaint my house", "Painting"),
    ("The paint on my wall is damaged", "Painting"),
    ("I want to change my wall color", "Painting"),
    ("My exterior walls need painting", "Painting"),
    ("I need touch-up painting", "Painting"),
    ("My ceiling needs repainting", "Painting"),
    ("The paint is peeling from my wall", "Painting"),
    ("I want my living room painted", "Painting"),
    ("My house needs a fresh coat of paint", "Painting"),
    ("I need interior painting", "Painting"),

    # ---------------- CLEANING ----------------
    ("My house needs cleaning", "Cleaning"),
    ("My kitchen is dirty", "Cleaning"),
    ("My bathroom needs cleaning", "Cleaning"),
    ("I need deep cleaning", "Cleaning"),
    ("My room is very dirty", "Cleaning"),
    ("I need my entire house cleaned", "Cleaning"),
    ("My kitchen needs deep cleaning", "Cleaning"),
    ("I need bathroom cleaning", "Cleaning"),
    ("There is a lot of dust in my house", "Cleaning"),
    ("I need someone to clean my home", "Cleaning"),
    ("My floor needs cleaning", "Cleaning"),
    ("I need post-construction cleaning", "Cleaning"),

    # ---------------- PEST CONTROL ----------------
    ("There are cockroaches in my kitchen", "Pest Control"),
    ("I have termites in my house", "Pest Control"),
    ("There are ants everywhere", "Pest Control"),
    ("I found bed bugs in my bedroom", "Pest Control"),
    ("There are rats in my house", "Pest Control"),
    ("I have a mosquito problem", "Pest Control"),
    ("There are insects all over my house", "Pest Control"),
    ("My wooden furniture has termites", "Pest Control"),
    ("I need cockroach treatment", "Pest Control"),
    ("There is a pest infestation in my kitchen", "Pest Control"),
    ("I need termite treatment", "Pest Control"),
    ("There are mice in my house", "Pest Control"),

    # ---------------- INVALID / OUT OF SCOPE ----------------
    ("Shop is not working", "INVALID"),
    ("Hello", "INVALID"),
    ("How are you?", "INVALID"),
    ("I need help", "INVALID"),
    ("Something is broken", "INVALID"),
    ("Fix my house", "INVALID"),
    ("My car is not starting", "INVALID"),
    ("I need a haircut", "INVALID"),
    ("I want food", "INVALID"),
    ("Find me a taxi", "INVALID"),
    ("My phone screen is broken", "INVALID"),
    ("I need a job", "INVALID"),
    ("Tell me a joke", "INVALID"),
    ("What is the weather today?", "INVALID"),
    ("abcdef xyz123", "INVALID"),
    ("123456789", "INVALID"),
    ("My laptop is slow", "INVALID"),
    ("I want to buy a house", "INVALID"),
    ("Can you write a poem?", "INVALID"),
    ("What is your name?", "INVALID"),
]


# ============================================================
# RUN TESTS
# ============================================================

total = len(test_cases)
passed = 0
failed = 0

failures = []

print("=" * 70)
print("NIBORAID AI SERVICE CLASSIFICATION TEST")
print("=" * 70)
print(f"Total test cases: {total}")
print()


for number, (problem, expected) in enumerate(test_cases, start=1):

    try:
        actual = detect_service(problem)

        # Clean model output
        actual = actual.strip()

        if actual.lower() == expected.lower():
            print(f"PASS {number:03d} | {problem}")
            print(f"       Expected: {expected}")
            print(f"       Got:      {actual}")
            passed += 1

        else:
            print(f"FAIL {number:03d} | {problem}")
            print(f"       Expected: {expected}")
            print(f"       Got:      {actual}")

            failed += 1

            failures.append({
                "number": number,
                "problem": problem,
                "expected": expected,
                "actual": actual
            })

    except Exception as e:
        print(f"ERROR {number:03d} | {problem}")
        print(f"       Expected: {expected}")
        print(f"       Error:    {e}")

        failed += 1

        failures.append({
            "number": number,
            "problem": problem,
            "expected": expected,
            "actual": f"ERROR: {e}"
        })

    print()


# ============================================================
# SUMMARY
# ============================================================

accuracy = (passed / total) * 100

print("=" * 70)
print("TEST SUMMARY")
print("=" * 70)

print(f"Total tests : {total}")
print(f"Passed      : {passed}")
print(f"Failed      : {failed}")
print(f"Accuracy    : {accuracy:.2f}%")

print()


# ============================================================
# SHOW FAILURES
# ============================================================

if failures:

    print("=" * 70)
    print("FAILED TEST CASES")
    print("=" * 70)

    for failure in failures:
        print(
            f"{failure['number']:03d}. "
            f"{failure['problem']}"
        )
        print(f"    Expected : {failure['expected']}")
        print(f"    Got      : {failure['actual']}")
        print()

else:

    print("=" * 70)
    print("🎉 ALL TESTS PASSED!")
    print("=" * 70)