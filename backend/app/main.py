from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, club, seasons, staff

app = FastAPI(title="TeampilotAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(club.router, prefix="/api/v1")
app.include_router(seasons.router, prefix="/api/v1")
app.include_router(staff.router, prefix="/api/v1")
