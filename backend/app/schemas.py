from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PreferenceCreate(BaseModel):
    interests: str
    budget: float
    travel_style: str

class LocationBase(BaseModel):
    name: str
    category: str
    city: str
    latitude: float
    longitude: float
    price_level: int = Field(ge=1, le=5)
    description: Optional[str] = None
    rating: Optional[float] = Field(default=0.0, ge=0.0, le=5.0)

class LocationResponse(LocationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RouteItemCreate(BaseModel):
    location_id: int = Field(gt=0)
    day_number: int = Field(gt=0)
    order_in_day: int = Field(gt=0)

class TravelRouteCreate(BaseModel):
    name: str
    city: str
    start_date: date
    end_date: date
    items: List[RouteItemCreate]

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date > self.end_date:
            raise ValueError("start_date must be before or equal to end_date")
        return self

class TravelRouteResponse(BaseModel):
    id: int
    name: str
    city: str
    start_date: date
    end_date: date
    model_config = ConfigDict(from_attributes=True)
