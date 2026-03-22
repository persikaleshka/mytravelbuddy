from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse 
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from .database import engine, Base
from .routes import users, locations, routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MyTravelBuddy")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

app.include_router(users.router, prefix="/auth", tags=["users"])
app.include_router(locations.router, prefix="/api", tags=["locations"])
app.include_router(routes.router, prefix="/api", tags=["routes"])

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})