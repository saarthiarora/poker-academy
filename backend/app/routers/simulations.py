from fastapi import APIRouter, HTTPException
from app.models.schemas import HandVsRangeRequest, QuizAnswerRequest
from app.services.simulation_service import (
    simulate_hand_vs_hand,
    simulate_hand_vs_range,
    get_random_quiz_scenario,
    PRESET_RANGES,
    DECISION_QUIZ_SCENARIOS
)

router = APIRouter(prefix="/api/simulations", tags=["simulations"])

@router.get("/presets")
def get_presets():
    return {"ranges": list(PRESET_RANGES.keys()), "definitions": PRESET_RANGES}

@router.post("/hand-vs-hand")
def hand_vs_hand(payload: dict):
    h1 = payload.get("hand1", [])
    h2 = payload.get("hand2", [])
    board = payload.get("board", [])
    sims = min(payload.get("simulations", 5000), 50000)
    try:
        return simulate_hand_vs_hand(h1, h2, board, sims)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/hand-vs-range")
def hand_vs_range(req: HandVsRangeRequest):
    try:
        return simulate_hand_vs_range(
            hero_cards=req.hero_cards,
            range_name_or_list=req.range_target,
            board_cards=req.board,
            simulations=min(req.simulations, 50000)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/quiz")
def get_quiz():
    return get_random_quiz_scenario()

@router.post("/quiz/check")
def check_quiz_answer(req: QuizAnswerRequest):
    quiz = next((q for q in DECISION_QUIZ_SCENARIOS if q["id"] == req.quiz_id), None)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz scenario not found")
    
    selected_opt = next((o for o in quiz["options"] if o["action"].lower() == req.selected_action.lower()), None)
    if not selected_opt:
        raise HTTPException(status_code=400, detail="Invalid action choice")

    return {
        "quiz_id": req.quiz_id,
        "is_correct": selected_opt["is_correct"],
        "explanation": selected_opt["explanation"],
        "options": quiz["options"]
    }

