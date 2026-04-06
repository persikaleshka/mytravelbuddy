from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, database, models
from .schemas import ApiRouteCreate, ApiRouteResponse, ApiRouteUpdate

router = APIRouter()


def _validate_locations_exist(location_ids: set[int], db: Session):
    if not location_ids:
        return
    existing_locations = (
        db.query(models.Location.id).filter(models.Location.id.in_(location_ids)).all()
    )
    existing_location_ids = {location_id for (location_id,) in existing_locations}
    missing_ids = sorted(location_ids - existing_location_ids)
    if missing_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown location_id values: {missing_ids}",
        )


def _serialize_route(route: models.TravelRoute) -> ApiRouteResponse:
    return ApiRouteResponse.from_db(
        route_id=route.id,
        user_id=route.user_id,
        name=route.name,
        city=route.city or "",
        start_date=route.start_date,
        end_date=route.end_date,
        created_at=route.created_at,
    )


@router.post("/routes", response_model=ApiRouteResponse)
async def create_route(
    route_data: ApiRouteCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    location_ids = {item.location_id for item in route_data.items}
    _validate_locations_exist(location_ids, db)

    try:
        db_route = models.TravelRoute(
            user_id=current_user.id,
            name=route_data.name,
            city=route_data.city,
            start_date=route_data.start_date,
            end_date=route_data.end_date,
        )
        db.add(db_route)
        db.flush()

        for item in route_data.items:
            db.add(
                models.RouteItem(
                    route_id=db_route.id,
                    location_id=item.location_id,
                    day_number=item.day_number,
                    order_in_day=item.order_in_day,
                )
            )
        db.commit()
        db.refresh(db_route)
    except Exception:
        db.rollback()
        raise
    return _serialize_route(db_route)


@router.get("/routes", response_model=list[ApiRouteResponse])
async def get_user_routes(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    routes = (
        db.query(models.TravelRoute)
        .filter(models.TravelRoute.user_id == current_user.id)
        .all()
    )
    return [_serialize_route(route) for route in routes]


@router.get("/routes/{route_id}", response_model=ApiRouteResponse)
async def get_route(
    route_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = (
        db.query(models.TravelRoute)
        .filter(
            models.TravelRoute.id == route_id,
            models.TravelRoute.user_id == current_user.id,
        )
        .first()
    )
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return _serialize_route(route)


@router.put("/routes/{route_id}", response_model=ApiRouteResponse)
async def update_route(
    route_id: int,
    payload: ApiRouteUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = (
        db.query(models.TravelRoute)
        .filter(
            models.TravelRoute.id == route_id,
            models.TravelRoute.user_id == current_user.id,
        )
        .first()
    )
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")

    if payload.name is not None:
        route.name = payload.name
    if payload.city is not None:
        route.city = payload.city
    if payload.start_date is not None:
        route.start_date = payload.start_date
    if payload.end_date is not None:
        route.end_date = payload.end_date

    if route.start_date > route.end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date",
        )

    if payload.items is not None:
        location_ids = {item.location_id for item in payload.items}
        _validate_locations_exist(location_ids, db)

        db.query(models.RouteItem).filter(models.RouteItem.route_id == route.id).delete(
            synchronize_session=False
        )
        for item in payload.items:
            db.add(
                models.RouteItem(
                    route_id=route.id,
                    location_id=item.location_id,
                    day_number=item.day_number,
                    order_in_day=item.order_in_day,
                )
            )

    db.commit()
    db.refresh(route)
    return _serialize_route(route)


@router.delete("/routes/{route_id}", status_code=204)
async def delete_route(
    route_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = (
        db.query(models.TravelRoute)
        .filter(
            models.TravelRoute.id == route_id,
            models.TravelRoute.user_id == current_user.id,
        )
        .first()
    )
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")

    db.query(models.RouteItem).filter(models.RouteItem.route_id == route.id).delete(
        synchronize_session=False
    )
    db.delete(route)
    db.commit()
