from pydantic import BaseModel, Field
from typing import List


class WorkerCreate(BaseModel):
    bio: str = Field(
        min_length=10,
        max_length=1000
    )

    experience_years: int = Field(
        ge=0,
        le=50
    )

    latitude: float = Field(
        ge=-90,
        le=90
    )

    longitude: float = Field(
        ge=-180,
        le=180
    )

    service_ids: List[int] = Field(
        min_length=1
    )