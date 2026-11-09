from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class NewGameRequest(BaseModel):
    table_size: int = 6
    small_blind: int = 10
    big_blind: int = 20
    starting_stack: int = 2000

class PlayerActionRequest(BaseModel):
    action: str # "fold", "check", "call", "bet", "raise", "all_in"
    amount: int = 0
    coaching_mode: bool = False

class TableSizeRequest(BaseModel):
    table_size: int

class CoachQuestionRequest(BaseModel):
    question: str
    hand_context: Optional[Dict[str, Any]] = None

class HandAnalysisRequest(BaseModel):
    hero_cards: List[str]
    board_cards: List[str] = []
    table_size: int = 6
    position: str = "BTN"
    stack_size: int = 2000
    pot_size: int = 50
    call_amount: int = 0
    action_history: List[str] = []

class SaveAnalysisRequest(BaseModel):
    title: str
    hero_cards: List[str]
    board_cards: List[str] = []
    position: str
    pot_size: int
    situation_details: str
    recommended_action: str
    equity_pct: float
    notes: Optional[str] = ""

class EquitySimulationRequest(BaseModel):
    players: List[Dict[str, Any]]
    board: List[str] = []
    num_simulations: int = 10000

class HandVsRangeRequest(BaseModel):
    hero_cards: List[str]
    range_target: Union[str, List[str]] = "top_10"
    board: List[str] = []
    simulations: int = 5000

class QuizAnswerRequest(BaseModel):
    quiz_id: str
    selected_action: str

