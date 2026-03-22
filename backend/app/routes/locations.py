from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, database, schemas

router = APIRouter()

@router.get("/locations", response_model=List[schemas.LocationResponse])
async def get_locations(
    city: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Location)
    if city:
        query = query.filter(models.Location.city.ilike(f"%{city}%"))
    if category:
        query = query.filter(models.Location.category == category)
    return query.all()

@router.post("/locations", response_model=schemas.LocationResponse)
async def create_location(location: schemas.LocationBase, db: Session = Depends(database.get_db)):
    db_location = models.Location(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location