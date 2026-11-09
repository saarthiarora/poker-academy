import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import game, coach, ranges, equity, simulations, analysis, stats
from app.database import init_db

app = FastAPI(
    title="Texas Hold'em Poker Academy API",
    description="Professional poker training engine, equity calculator, range matrix, and AI coaching platform.",
    version="1.0.0"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database schema
init_db()

# Mount API routers
app.include_router(game.router)
app.include_router(coach.router)
app.include_router(ranges.router)
app.include_router(equity.router)
app.include_router(simulations.router)
app.include_router(analysis.router)
app.include_router(stats.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Texas Hold'em Poker Academy API",
        "version": "1.0.0"
    }

# Mount frontend/dist if built
DIST_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.isdir(DIST_PATH):
    app.mount("/", StaticFiles(directory=DIST_PATH, html=True), name="static")
