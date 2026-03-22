from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database, schemas, auth

router = APIRouter()

@router.post("/routes", response_model=schemas.TravelRouteResponse)
async def create_route(
    route_data: schemas.TravelRouteCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    db_route = models.TravelRoute(
        user_id=current_user.id,
        name=route_data.name,
        city=route_data.city,
        start_date=route_data.start_date,
        end_date=route_data.end_date
    )
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    
    for item in route_data.items:
        db_item = models.RouteItem(
            route_id=db_route.id,
            location_id=item.location_id,
            day_number=item.day_number,
            order_in_day=item.order_in_day
        )
        db.add(db_item)
    db.commit()
    
    return db_route

@router.get("/routes", response_model=list[schemas.TravelRouteResponse])
async def get_user_routes(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.TravelRoute).filter(models.TravelRoute.user_id == current_user.id).all()