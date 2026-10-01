from pydantic import BaseModel, Field, model_validator
from datetime import date, time, datetime


class BookingCreate(BaseModel):
    worker_id: int = Field(gt=0)
    service_id: int = Field(gt=0)

    booking_date: date
    start_time: time
    end_time: time

    problem_description: str = Field(
        min_length=5,
        max_length=1000
    )

    @model_validator(mode="after")
    def validate_booking(self):

        # Start time must be before end time
        if self.start_time >= self.end_time:
            raise ValueError(
                "Start time must be before end time"
            )

        # Date cannot be in the past
        if self.booking_date < date.today():
            raise ValueError(
                "Booking date cannot be in the past"
            )

        # If booking is today, start time cannot already have passed
        if self.booking_date == date.today():
            current_time = datetime.now().time()

            if self.start_time <= current_time:
                raise ValueError(
                    "Booking start time must be in the future"
                )

        return self