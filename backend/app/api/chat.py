from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, database, models
from .schemas import ApiChatMessageCreate, ApiChatMessageResponse, ApiChatSendResponse

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


def _to_response(message: models.ChatMessage) -> ApiChatMessageResponse:
    return ApiChatMessageResponse.from_db(
        message_id=message.id,
        route_id=message.route_id,
        user_id=message.user_id,
        sender=message.sender,
        text=message.text,
        created_at=message.created_at,
    )


def _build_assistant_reply(route: models.TravelRoute, user_text: str) -> str:
    preview = user_text[:120]
    return (
        f"Принял сообщение по поездке '{route.name}'. "
        f"Город: {route.city}. "
        f"Ключевой запрос: {preview}"
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

        assistant_reply = _build_assistant_reply(route, payload.text)
        assistant_message = models.ChatMessage(
            route_id=route.id,
            user_id=current_user.id,
            sender="assistant",
            text=assistant_reply,
        )
        db.add(assistant_message)
        db.commit()

        db.refresh(user_message)
        db.refresh(assistant_message)
    except Exception:
        db.rollback()
        raise

    return ApiChatSendResponse(
        user_message=_to_response(user_message),
        assistant_message=_to_response(assistant_message),
    )
