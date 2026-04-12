from datetime import date, datetime
from typing import Literal, Optional

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


class ApiRouteItem(BaseModel):
    location_id: int = Field(gt=0)
    day_number: int = Field(gt=0)
    order_in_day: int = Field(gt=0)


class ApiRouteCreate(BaseModel):
    name: str
    city: str
    start_date: date
    end_date: date
    items: list[ApiRouteItem] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date > self.end_date:
            raise ValueError("start_date must be before or equal to end_date")
        return self


class ApiRouteUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    items: Optional[list[ApiRouteItem]] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("start_date must be before or equal to end_date")
        return self


class ApiRouteResponse(BaseModel):
    id: str
    name: str
    city: str
    start_date: str
    end_date: str
    userId: str
    createdAt: str
    updatedAt: str

    @classmethod
    def from_db(
        cls,
        route_id: int,
        user_id: int,
        name: str,
        city: str,
        start_date: date,
        end_date: date,
        created_at: datetime,
    ) -> "ApiRouteResponse":
        created = created_at.isoformat()
        return cls(
            id=str(route_id),
            name=name,
            city=city,
            start_date=start_date.isoformat()
            if hasattr(start_date, "isoformat")
            else str(start_date),
            end_date=end_date.isoformat()
            if hasattr(end_date, "isoformat")
            else str(end_date),
            userId=str(user_id),
            createdAt=created,
            updatedAt=created,
        )


BudgetValue = Literal["эконом", "средний", "люкс"]
TravelStyleValue = Literal["расслабленный", "активный", "культурный"]


class ApiProfileResponse(BaseModel):
    preferences: list[str]
    budget: BudgetValue
    travel_style: list[TravelStyleValue]


class ApiProfileUpdate(BaseModel):
    preferences: list[str] = Field(default_factory=list)
    budget: BudgetValue
    travel_style: list[TravelStyleValue] = Field(min_length=1)

    @model_validator(mode="after")
    def normalize(self):
        self.preferences = [value.strip() for value in self.preferences if value.strip()]
        self.travel_style = list(dict.fromkeys(self.travel_style))
        return self


ChatSender = Literal["user", "assistant"]


class ApiChatMessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=4000)

    @model_validator(mode="after")
    def normalize(self):
        self.text = self.text.strip()
        if not self.text:
            raise ValueError("Message text cannot be empty")
        return self


class ApiChatMessageResponse(BaseModel):
    id: str
    routeId: str
    userId: str
    sender: ChatSender
    text: str
    createdAt: str

    @classmethod
    def from_db(
        cls,
        message_id: int,
        route_id: int,
        user_id: int,
        sender: str,
        text: str,
        created_at: datetime,
    ) -> "ApiChatMessageResponse":
        return cls(
            id=str(message_id),
            routeId=str(route_id),
            userId=str(user_id),
            sender=sender,  # type: ignore[arg-type]
            text=text,
            createdAt=created_at.isoformat(),
        )


class ApiChatSendResponse(BaseModel):
    user_message: ApiChatMessageResponse
    assistant_message: ApiChatMessageResponse


class ApiRoutePointResponse(BaseModel):
    location_id: str
    name: str
    category: str
    latitude: float
    longitude: float
    day_number: int
    order_in_day: int


class ApiRoutePageResponse(BaseModel):
    route: ApiRouteResponse
    preferences: list[str]
    route_points: list[ApiRoutePointResponse]
    weather: dict
    tickets: list[dict]
