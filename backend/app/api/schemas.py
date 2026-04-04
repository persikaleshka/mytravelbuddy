from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    description: str = ""
    locations: list[str] = Field(default_factory=list)


class ApiRouteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    locations: Optional[list[str]] = None


class ApiRouteResponse(BaseModel):
    id: str
    name: str
    description: str
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
        description: str,
        created_at: datetime,
        location_ids: list[int],
    ) -> "ApiRouteResponse":
        created = created_at.isoformat()
        return cls(
            id=str(route_id),
            name=name,
            description=description,
            locations=[str(location_id) for location_id in location_ids],
            userId=str(user_id),
            createdAt=created,
            updatedAt=created,
        )
