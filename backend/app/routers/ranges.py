from fastapi import APIRouter, Query
from app.services.range_service import get_complete_matrix, RANGE_SOURCES

router = APIRouter(prefix="/api/ranges", tags=["ranges"])

@router.get("/matrix")
def get_range_matrix(
    table_format: str = Query("6max", description="6max, 9max, or heads_up"),
    position: str = Query("BTN", description="UTG, UTG+1, LJ, HJ, CO, BTN, SB, BB"),
    situation: str = Query("rfi", description="rfi, facing_open, facing_3bet, facing_4bet, bb_defense"),
    stack_depth: str = Query("100bb", description="20bb, 40bb, 60bb, 100bb, 150bb")
):
    return get_complete_matrix(table_format, position, situation, stack_depth)

@router.get("/sources")
def get_sources():
    return RANGE_SOURCES

