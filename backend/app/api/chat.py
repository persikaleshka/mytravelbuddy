from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, database, models
from ..integrations import generate_trip_assistant_output
from ..services import extract_map_points_from_text, format_assistant_text
from .schemas import (
    ApiChatMapPoint,
    ApiChatMessageCreate,
    ApiChatMessageResponse,
    ApiChatSendResponse,
)

router = APIRouter()
CHAT_HISTORY_LIMIT = 12


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


def _to_response(message: models.ChatMessage) -> ApiChatMessageResponse:
    formatted_text = (
        format_assistant_text(message.text) if message.sender == "assistant" else message.text
    )
    return ApiChatMessageResponse.from_db(
        message_id=message.id,
        route_id=message.route_id,
        user_id=message.user_id,
        sender=message.sender,
        text=message.text,
        created_at=message.created_at,
        formatted_text=formatted_text,
    )


def _get_user_preferences_text(user: models.User) -> str:
    if user.preferences is None or not user.preferences.interests:
        return ""
    values = [value.strip() for value in user.preferences.interests.split(",")]
    clean_values = [value for value in values if value]
    return ", ".join(clean_values)


def _get_recent_history(
    route_id: int,
    user_id: int,
    db: Session,
    limit: int = CHAT_HISTORY_LIMIT,
) -> list[dict[str, str]]:
    recent_messages = (
        db.query(models.ChatMessage)
        .filter(
            models.ChatMessage.route_id == route_id,
            models.ChatMessage.user_id == user_id,
        )
        .order_by(models.ChatMessage.created_at.desc(), models.ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    recent_messages.reverse()
    return [
        {
            "sender": message.sender,
            "text": message.text,
        }
        for message in recent_messages
    ]


def _build_assistant_reply(
    route: models.TravelRoute,
    current_user: models.User,
    db: Session,
    user_text: str,
) -> dict:
    history = _get_recent_history(route.id, current_user.id, db)
    preferences = _get_user_preferences_text(current_user)
    return generate_trip_assistant_output(
        route_name=route.name,
        city=route.city,
        start_date=str(route.start_date),
        end_date=str(route.end_date),
        preferences=preferences,
        history=history,
        user_text=user_text,
    )


@router.get("/routes/{route_id}/messages", response_model=list[ApiChatMessageResponse])
async def get_route_messages(
    route_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    _get_owned_route(route_id, current_user, db)
    messages = (
        db.query(models.ChatMessage)
        .filter(
            models.ChatMessage.route_id == route_id,
            models.ChatMessage.user_id == current_user.id,
        )
        .order_by(models.ChatMessage.created_at.asc(), models.ChatMessage.id.asc())
        .all()
    )
    return [_to_response(message) for message in messages]


@router.post("/routes/{route_id}/messages", response_model=ApiChatSendResponse)
async def send_route_message(
    route_id: int,
    payload: ApiChatMessageCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    route = _get_owned_route(route_id, current_user, db)

    try:
        user_message = models.ChatMessage(
            route_id=route.id,
            user_id=current_user.id,
            sender="user",
            text=payload.text,
        )
        db.add(user_message)
        db.flush()

        assistant_output = _build_assistant_reply(route, current_user, db, payload.text)
        assistant_reply = assistant_output.get("text", "")
        if not isinstance(assistant_reply, str):
            assistant_reply = ""
        assistant_structured = assistant_output.get("structured", {})
        if not isinstance(assistant_structured, dict):
            assistant_structured = {}

        formatted_assistant_reply = format_assistant_text(assistant_reply)
        assistant_message = models.ChatMessage(
            route_id=route.id,
            user_id=current_user.id,
            sender="assistant",
            text=formatted_assistant_reply,
        )
        db.add(assistant_message)
        db.commit()

        db.refresh(user_message)
        db.refresh(assistant_message)

        map_points = [
            ApiChatMapPoint(**point)
            for point in extract_map_points_from_text(
                db=db,
                city=route.city,
                assistant_text=formatted_assistant_reply,
                structured_places=assistant_structured.get("places"),
            )
        ]
    except Exception:
        db.rollback()
        raise

    return ApiChatSendResponse(
        user_message=_to_response(user_message),
        assistant_message=_to_response(assistant_message),
        map_points=map_points,
        assistant_structured=assistant_structured,
    )
