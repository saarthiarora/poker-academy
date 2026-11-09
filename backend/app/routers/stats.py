from fastapi import APIRouter
from app.services.stats_service import get_overall_statistics, reset_all_statistics

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/overview")
def get_stats_overview():
    return get_overall_statistics()

@router.post("/reset")
def reset_stats():
    reset_all_statistics()
    return {"status": "success", "message": "All training statistics have been reset"}

