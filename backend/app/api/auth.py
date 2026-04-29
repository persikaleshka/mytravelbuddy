from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas
from .schemas import ApiAuthResponse, ApiUser

router = APIRouter()


@router.post("/register", response_model=ApiAuthResponse)
async def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, name=user.name, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    db_pref = models.UserPreference(
        user_id=db_user.id,
        interests="",
        budget=0,
        travel_style="relaxed",
    )
    db.add(db_pref)
    db.commit()

    access_token = auth.create_access_token(data={"sub": db_user.email})
    return ApiAuthResponse(
        token=access_token,
        user=ApiUser(id=str(db_user.id), email=db_user.email, name=db_user.name),
    )


@router.post("/login", response_model=ApiAuthResponse)
async def login(form_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = auth.create_access_token(data={"sub": user.email})
    return ApiAuthResponse(
        token=access_token,
        user=ApiUser(id=str(user.id), email=user.email, name=user.name),
    )
