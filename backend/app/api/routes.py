from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, database, models
from .schemas import ApiRouteCreate, ApiRouteResponse, ApiRouteUpdate

router = APIRouter()


def _parse_location_ids(raw_ids: list[str]) -> list[int]:
    parsed: list[int] = []
    for raw_id in raw_ids:
        try:
            location_id = int(raw_id)
        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid location id '{raw_id}', expected integer-like string",
            ) from exc
        if location_id <= 0:
            raise HTTPException(status_code=400, detail="Location ids must be positive")
        parsed.append(location_id)
    return parsed


def _serialize_route(route: models.TravelRoute) -> ApiRouteResponse:
    sorted_items = sorted(route.items, key=lambda item: (item.day_number, item.order_in_day))
    return ApiRouteResponse.from_db(
        route_id=route.id,
        user_id=route.user_id,
        name=route.name,
        description=route.city or "",
        created_at=route.created_at,
        location_ids=[item.location_id for item in sorted_items],
    )


@router.post("/routes", response_model=ApiRouteResponse)
async def create_route(
    route_data: ApiRouteCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    parsed_location_ids = _parse_location_ids(route_data.locations)
    location_ids = set(parsed_location_ids)
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

    try:
        db_route = models.TravelRoute(
            user_id=current_user.id,
            name=route_data.name,
            city=route_data.description or "",
            start_date=date.today(),
            end_date=date.today(),
        )
        db.add(db_route)
        db.flush()

        for index, location_id in enumerate(parsed_location_ids, start=1):
            db.add(
                models.RouteItem(
                    route_id=db_route.id,
                    location_id=location_id,
                    day_number=1,
                    order_in_day=index,
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
    if payload.description is not None:
        route.city = payload.description

    if payload.locations is not None:
        parsed_location_ids = _parse_location_ids(payload.locations)
        location_ids = set(parsed_location_ids)
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

        db.query(models.RouteItem).filter(models.RouteItem.route_id == route.id).delete(
            synchronize_session=False
        )
        for index, location_id in enumerate(parsed_location_ids, start=1):
            db.add(
                models.RouteItem(
                    route_id=route.id,
                    location_id=location_id,
                    day_number=1,
                    order_in_day=index,
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
