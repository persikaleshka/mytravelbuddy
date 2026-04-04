from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, database, models
from .schemas import ApiProfileResponse, ApiProfileUpdate

router = APIRouter()

_BUDGET_TO_SCORE = {
    "эконом": 1.0,
    "средний": 2.0,
    "люкс": 3.0,
}
_SCORE_TO_BUDGET = {
    1: "эконом",
    2: "средний",
    3: "люкс",
}


def _ensure_preferences(user: models.User, db: Session) -> models.UserPreference:
    if user.preferences is not None:
        return user.preferences
    pref = models.UserPreference(
        user_id=user.id,
        interests="",
        budget=2.0,
        travel_style="расслабленный",
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    db.refresh(user)
    return pref


def _serialize_profile(pref: models.UserPreference) -> ApiProfileResponse:
    preferences = [value.strip() for value in (pref.interests or "").split(",") if value.strip()]
    travel_style = [value.strip() for value in (pref.travel_style or "").split(",") if value.strip()]
    budget_value = _SCORE_TO_BUDGET.get(int(round(pref.budget or 2.0)), "средний")
    return ApiProfileResponse(
        preferences=preferences,
        budget=budget_value,
        travel_style=travel_style or ["расслабленный"],
    )


@router.get("/profile", response_model=ApiProfileResponse)
async def get_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    pref = _ensure_preferences(current_user, db)
    return _serialize_profile(pref)


@router.put("/profile", response_model=ApiProfileResponse)
async def update_profile(
    payload: ApiProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    pref = _ensure_preferences(current_user, db)
    pref.interests = ", ".join(payload.preferences)
    pref.budget = _BUDGET_TO_SCORE[payload.budget]
    pref.travel_style = ", ".join(payload.travel_style)
    db.commit()
    db.refresh(pref)
    return _serialize_profile(pref)
