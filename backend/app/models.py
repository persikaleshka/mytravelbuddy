from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    routes = relationship("TravelRoute", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")

class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    interests = Column(String, default="")  # JSON-like string: "museum,cafe,park"
    budget = Column(Float, default=0.0)
    travel_style = Column(String, default="relaxed")  # "relaxed", "active", "cultural"
    user = relationship("User", back_populates="preferences")

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # "museum", "cafe", "park"
    city = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    price_level = Column(Integer, nullable=False)  # 1-5
    description = Column(String)
    rating = Column(Float, default=0.0)

class TravelRoute(Base):
    __tablename__ = "travel_routes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="routes")
    items = relationship("RouteItem", back_populates="route")
    chat_messages = relationship(
        "ChatMessage",
        back_populates="route",
        cascade="all, delete-orphan",
    )

class RouteItem(Base):
    __tablename__ = "route_items"
    id = Column(Integer, primary_key=True)
    route_id = Column(Integer, ForeignKey("travel_routes.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    order_in_day = Column(Integer, nullable=False)
    route = relationship("TravelRoute", back_populates="items")
    location = relationship("Location")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    route_id = Column(Integer, ForeignKey("travel_routes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender = Column(String, nullable=False)  # "user" | "assistant"
    text = Column(String, nullable=False)
    ai_payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    route = relationship("TravelRoute", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")
