from pydantic import BaseModel, Field, field_validator
from typing import Literal
import re


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str
    password: str = Field(min_length=8)
    phone: str
    role: Literal["customer", "worker"]

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        if not re.fullmatch(r"[0-9]{10}", value):
            raise ValueError("Phone number must contain exactly 10 digits")

        return value


class UserLogin(BaseModel):
    email: str
    password: str