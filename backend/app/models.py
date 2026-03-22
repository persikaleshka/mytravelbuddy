from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    preferences = relationship("UserPreference", back_populates="user", uselist=False)
    routes = relationship("TravelRoute", back_populates="user")

class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    interests = Column(String)  # JSON-like string: "museum,cafe,park"
    budget = Column(Float)
    travel_style = Column(String)  # "relaxed", "active", "cultural"
    user = relationship("User", back_populates="preferences")

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)  # "museum", "cafe", "park"
    city = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    price_level = Column(Integer)  # 1-5
    description = Column(String)
    rating = Column(Float, default=0.0)

class TravelRoute(Base):
    __tablename__ = "travel_routes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    city = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="routes")
    items = relationship("RouteItem", back_populates="route")

class RouteItem(Base):
    __tablename__ = "route_items"
    id = Column(Integer, primary_key=True)
    route_id = Column(Integer, ForeignKey("travel_routes.id"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    day_number = Column(Integer)
    order_in_day = Column(Integer)
    route = relationship("TravelRoute", back_populates="items")
    location = relationship("Location")