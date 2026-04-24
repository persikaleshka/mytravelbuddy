from fastapi import APIRouter, Depends, HTTPException
import json
from sqlalchemy.orm import Session

from .. import auth, database, models
from ..integrations import get_city_weather_forecast
from ..services import extract_map_points_from_text
from .schemas import (
    ApiRouteCreate,
    ApiRoutePageResponse,
    ApiRoutePointResponse,
    ApiRouteResponse,
    ApiRouteUpdate,
)

router = APIRouter()


def _get_owned_route(
    route_id: int,
    current_user: models.User,
    db: Session,
) -> models.TravelRoute:
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
    return route


def _get_existing_location_ids(location_ids: set[int], db: Session) -> set[int]:
    if not location_ids:
        return set()
    existing_locations = (
        db.query(models.Location.id).filter(models.Location.id.in_(location_ids)).all()
    )
    return {location_id for (location_id,) in existing_locations}


def _ensure_user_preferences(user: models.User, db: Session) -> models.UserPreference:
    if user.preferences is not None:
        return user.preferences
    pref = models.UserPreference(
        user_id=user.id,
        interests="",
        budget=0.0,
        travel_style="relaxed",
    )
    db.add(pref)
    db.flush()
    return pref


def _save_preferences_from_items(
    user: models.User,
    items: list,
    db: Session,
):
    pref = _ensure_user_preferences(user, db)
    pref.interests = ",".join(str(item.location_id) for item in items)


def _sync_route_items(
    route_id: int,
    items: list,
    db: Session,
):
    submitted_ids = [item.location_id for item in items]
    existing_location_ids = _get_existing_location_ids(set(submitted_ids), db)

    for item in items:
        if item.location_id not in existing_location_ids:
            continue
        db.add(
            models.RouteItem(
                route_id=route_id,
                location_id=item.location_id,
                day_number=item.day_number,
                order_in_day=item.order_in_day,
            )
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


def _build_route_points(route: models.TravelRoute) -> list[ApiRoutePointResponse]:
    sorted_items = sorted(route.items, key=lambda item: (item.day_number, item.order_in_day))
    route_points = []
    for item in sorted_items:
        if item.location is None:
            continue
        route_points.append(
            ApiRoutePointResponse(
                location_id=str(item.location_id),
                name=item.location.name,
                category=item.location.category,
                latitude=item.location.latitude,
                longitude=item.location.longitude,
                day_number=item.day_number,
                order_in_day=item.order_in_day,
            )
        )
    return route_points


@router.post("/routes", response_model=ApiRouteResponse)
async def create_route(
    route_data: ApiRouteCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
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

        _save_preferences_from_items(current_user, route_data.items, db)
        _sync_route_items(db_route.id, route_data.items, db)
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
    route = _get_owned_route(route_id, current_user, db)
    return _serialize_route(route)


@router.get("/routes/{route_id}/page", response_model=ApiRoutePageResponse)
async def get_route_page(
    route_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = _get_owned_route(route_id, current_user, db)
    route_points = _build_route_points(route)

    preferences: list[str] = []
    if current_user.preferences and current_user.preferences.interests:
        preferences = [
            value.strip()
            for value in current_user.preferences.interests.split(",")
            if value.strip()
        ]

    weather = get_city_weather_forecast(
        city=route.city,
        start_date=str(route.start_date),
        end_date=str(route.end_date),
    )
    tickets: list[dict] = []

    return ApiRoutePageResponse(
        route=_serialize_route(route),
        preferences=preferences,
        route_points=route_points,
        weather=weather,
        tickets=tickets,
    )


@router.get("/routes/{route_id}/weather")
async def get_route_weather(
    route_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = _get_owned_route(route_id, current_user, db)
    return get_city_weather_forecast(
        city=route.city,
        start_date=str(route.start_date),
        end_date=str(route.end_date),
    )


@router.get("/routes/{route_id}/map")
async def get_route_map_data(
    route_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = _get_owned_route(route_id, current_user, db)
    route_points = _build_route_points(route)
    center = None
    if route_points:
        avg_lat = sum(point.latitude for point in route_points) / len(route_points)
        avg_lon = sum(point.longitude for point in route_points) / len(route_points)
        center = {"latitude": avg_lat, "longitude": avg_lon}

    all_assistant_messages = (
        db.query(models.ChatMessage)
        .filter(
            models.ChatMessage.route_id == route.id,
            models.ChatMessage.user_id == current_user.id,
            models.ChatMessage.sender == "assistant",
        )
        .order_by(models.ChatMessage.created_at.asc(), models.ChatMessage.id.asc())
        .all()
    )
    seen: dict[str, dict] = {}
    for msg in all_assistant_messages:
        structured_places = None
        if msg.ai_payload:
            try:
                payload = json.loads(msg.ai_payload)
                if isinstance(payload, dict):
                    maybe_places = payload.get("places")
                    if isinstance(maybe_places, list):
                        structured_places = maybe_places
            except Exception:
                pass
        points = extract_map_points_from_text(
            db=db,
            city=route.city,
            assistant_text=msg.text,
            structured_places=structured_places,
        )
        for p in points:
            key = f"{p['location_id']}::{p.get('day') or 0}"
            seen[key] = p

    by_location: dict[str, dict] = {}
    for p in seen.values():
        loc_id = p["location_id"]
        existing = by_location.get(loc_id)
        if existing is None:
            by_location[loc_id] = p
        elif not existing.get("day") and p.get("day"):
            by_location[loc_id] = p
    chat_suggestions = list(by_location.values())

    return {
        "status": "ok",
        "routeId": str(route.id),
        "city": route.city,
        "center": center,
        "points": [point.model_dump() for point in route_points],
        "chat_suggestions": chat_suggestions,
    }


@router.put("/routes/{route_id}", response_model=ApiRouteResponse)
async def update_route(
    route_id: int,
    payload: ApiRouteUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = _get_owned_route(route_id, current_user, db)

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
        db.query(models.RouteItem).filter(models.RouteItem.route_id == route.id).delete(
            synchronize_session=False
        )
        _save_preferences_from_items(current_user, payload.items, db)
        _sync_route_items(route.id, payload.items, db)

    db.commit()
    db.refresh(route)
    return _serialize_route(route)


@router.delete("/routes/{route_id}", status_code=204)
async def delete_route(
    route_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = _get_owned_route(route_id, current_user, db)

    db.query(models.RouteItem).filter(models.RouteItem.route_id == route.id).delete(
        synchronize_session=False
    )
    db.delete(route)
    db.commit()
