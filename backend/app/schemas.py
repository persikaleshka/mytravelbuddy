from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

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
    class Config:
        from_attributes = True

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
    price_level: int
    description: Optional[str] = None
    rating: Optional[float] = 0.0

class LocationResponse(LocationBase):
    id: int
    class Config:
        from_attributes = True

class RouteItemCreate(BaseModel):
    location_id: int
    day_number: int
    order_in_day: int

class TravelRouteCreate(BaseModel):
    name: str
    city: str
    start_date: str
    end_date: str
    items: List[RouteItemCreate]

class TravelRouteResponse(BaseModel):
    id: int
    name: str
    city: str
    start_date: str
    end_date: str
    class Config:
        from_attributes = True