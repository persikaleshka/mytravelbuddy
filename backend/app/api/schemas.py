from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class ApiUser(BaseModel):
    id: str
    email: EmailStr
    name: str


class ApiAuthResponse(BaseModel):
    token: str
    user: ApiUser


class ApiLocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    city: str
    category: str
    latitude: float
    longitude: float
    price_level: int = Field(default=1, ge=1, le=5)
    rating: float = Field(default=0.0, ge=0.0, le=5.0)


class ApiLocationResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    city: str
    category: str
    latitude: float
    longitude: float
    imageUrl: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ApiRouteCreate(BaseModel):
    name: str
    cities: list[str] = Field(min_length=1)
    startDate: date
    endDate: date
    preferences: str = ""
    locations: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.startDate > self.endDate:
            raise ValueError("startDate must be before or equal to endDate")
        return self


class ApiRouteUpdate(BaseModel):
    name: Optional[str] = None
    cities: Optional[list[str]] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    preferences: Optional[str] = None
    locations: Optional[list[str]] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.startDate and self.endDate and self.startDate > self.endDate:
            raise ValueError("startDate must be before or equal to endDate")
        return self


class ApiRouteResponse(BaseModel):
    id: str
    name: str
    cities: list[str]
    startDate: str
    endDate: str
    preferences: str
    locations: list[str]
    userId: str
    createdAt: str
    updatedAt: str

    @classmethod
    def from_db(
        cls,
        route_id: int,
        user_id: int,
        name: str,
        cities: list[str],
        start_date: date,
        end_date: date,
        preferences: str,
        created_at: datetime,
        location_ids: list[int],
    ) -> "ApiRouteResponse":
        created = created_at.isoformat()
        return cls(
            id=str(route_id),
            name=name,
            cities=cities,
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            preferences=preferences,
            locations=[str(location_id) for location_id in location_ids],
            userId=str(user_id),
            createdAt=created,
            updatedAt=created,
        )
