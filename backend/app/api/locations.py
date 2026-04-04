from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import database, models
from .schemas import ApiLocationCreate, ApiLocationResponse

router = APIRouter()


@router.get("/locations", response_model=list[ApiLocationResponse])
async def get_locations(
    city: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    query = db.query(models.Location)
    if city:
        query = query.filter(models.Location.city.ilike(f"%{city}%"))
    if category:
        query = query.filter(models.Location.category == category)
    locations = query.all()
    return [
        ApiLocationResponse(
            id=str(location.id),
            name=location.name,
            description=location.description,
            city=location.city,
            category=location.category,
            latitude=location.latitude,
            longitude=location.longitude,
            imageUrl=None,
        )
        for location in locations
    ]


@router.post("/locations", response_model=ApiLocationResponse)
async def create_location(
    location: ApiLocationCreate,
    db: Session = Depends(database.get_db),
):
    db_location = models.Location(
        name=location.name,
        description=location.description,
        city=location.city,
        category=location.category,
        latitude=location.latitude,
        longitude=location.longitude,
        price_level=location.price_level,
        rating=location.rating,
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return ApiLocationResponse(
        id=str(db_location.id),
        name=db_location.name,
        description=db_location.description,
        city=db_location.city,
        category=db_location.category,
        latitude=db_location.latitude,
        longitude=db_location.longitude,
        imageUrl=None,
    )
