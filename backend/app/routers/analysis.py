import uuid
from fastapi import APIRouter, HTTPException
from app.models.schemas import HandAnalysisRequest, SaveAnalysisRequest
from app.engine.card import parse_cards
from app.engine.hand_evaluator import evaluate_hand
from app.engine.equity_calculator import run_equity_simulation
from app.services.coaching_service import analyze_user_decision
from app.database import get_connection

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.post("/evaluate")
def evaluate_custom_hand(req: HandAnalysisRequest):
    if len(req.hero_cards) != 2:
        raise HTTPException(status_code=400, detail="Must provide exactly 2 hero hole cards")
    
    parsed_hero = parse_cards(req.hero_cards)
    parsed_board = parse_cards(req.board_cards) if req.board_cards else []

    # 1. Hand strength
    street = "preflop" if len(parsed_board) == 0 else ("flop" if len(parsed_board) == 3 else ("turn" if len(parsed_board) == 4 else "river"))
    current_eval = evaluate_hand(parsed_hero + parsed_board) if len(parsed_hero + parsed_board) >= 5 else None

    # 2. Equity estimation vs 1 random opponent
    players = [
        {"id": "hero", "label": "Hero", "cards": [str(c) for c in parsed_hero]},
        {"id": "villain", "label": "Opponent Range", "cards": []}
    ]
    eq_res = run_equity_simulation(players, parsed_board, num_simulations=3000)
    hero_equity = eq_res["results"][0]["equity_pct"]

    # 3. Pot odds & EV
    if req.call_amount > 0:
        total_pot_after_call = req.pot_size + req.call_amount
        pot_odds_pct = round((req.call_amount / total_pot_after_call) * 100, 1)
        pot_odds_ratio = f"{round(req.pot_size / req.call_amount, 1)} : 1"
        # Expected value of calling = (Equity * total_pot_after_call) - call_amount
        call_ev = round((hero_equity / 100.0) * total_pot_after_call - req.call_amount, 1)
    else:
        pot_odds_pct = 0.0
        pot_odds_ratio = "Free check"
        call_ev = 0.0

    # 4. Strategic recommendation
    decision = analyze_user_decision(
        hole_cards=parsed_hero,
        board=parsed_board,
        street=street,
        position=req.position,
        pot_size=req.pot_size,
        call_amount=req.call_amount,
        action_taken=req.action_history[-1] if req.action_history else "check",
        action_amount=0,
        stack_size=req.stack_size,
        table_size=req.table_size
    )

    return {
        "street": street,
        "hero_cards": [c.to_dict() for c in parsed_hero],
        "board_cards": [c.to_dict() for c in parsed_board],
        "hand_evaluation": current_eval.to_dict() if current_eval else None,
        "equity_pct": hero_equity,
        "pot_odds_pct": pot_odds_pct,
        "pot_odds_ratio": pot_odds_ratio,
        "call_ev": call_ev,
        "recommended_action": decision["recommended_action"],
        "feedback_reason": decision["feedback_reason"],
        "strategic_lesson": decision["strategic_lesson"],
        "decision_details": decision
    }

@router.get("/saved")
def get_saved_analyses():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saved_analyses ORDER BY timestamp DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.post("/save")
def save_analysis(req: SaveAnalysisRequest):
    conn = get_connection()
    cursor = conn.cursor()
    analysis_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO saved_analyses (
            id, title, hero_cards, board_cards, position, pot_size,
            situation_details, recommended_action, equity_pct, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_id,
        req.title,
        ",".join(req.hero_cards),
        ",".join(req.board_cards),
        req.position,
        req.pot_size,
        req.situation_details,
        req.recommended_action,
        req.equity_pct,
        req.notes or ""
    ))
    conn.commit()
    conn.close()
    return {"id": analysis_id, "status": "saved"}

