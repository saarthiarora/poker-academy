from fastapi import APIRouter
from app.models.schemas import CoachQuestionRequest
from app.services.coaching_service import answer_coaching_question

router = APIRouter(prefix="/api/coach", tags=["coach"])

@router.post("/ask")
def ask_coach(req: CoachQuestionRequest):
    response = answer_coaching_question(req.question, req.hand_context)
    return response

