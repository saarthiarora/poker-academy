from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.engine.game_state import PokerGame
from app.models.schemas import NewGameRequest, PlayerActionRequest, TableSizeRequest
from app.services.coaching_service import analyze_user_decision, generate_post_hand_review
from app.services.stats_service import record_completed_hand

router = APIRouter(prefix="/api/game", tags=["game"])

# Singleton active game instance for current session
active_game: Optional[PokerGame] = None
last_hand_review: Optional[Dict[str, Any]] = None
current_hand_decisions: list = []

def get_or_create_game() -> PokerGame:
    global active_game
    if active_game is None:
        active_game = PokerGame(table_size=6, small_blind=10, big_blind=20, starting_stack=2000)
        active_game.start_new_hand()
    return active_game

@router.post("/new")
def start_new_game(req: NewGameRequest):
    global active_game, last_hand_review, current_hand_decisions
    active_game = PokerGame(
        table_size=req.table_size,
        small_blind=req.small_blind,
        big_blind=req.big_blind,
        starting_stack=req.starting_stack
    )
    active_game.start_new_hand()
    last_hand_review = None
    current_hand_decisions = []
    
    # If first actor preflop is an AI, auto-advance until hero's turn
    active_game.play_ai_turns()
    return active_game.get_state_dict()

@router.get("/state")
def get_state():
    game = get_or_create_game()
    return game.get_state_dict()

@router.post("/set-table-size")
def set_table_size(req: TableSizeRequest):
    global active_game, current_hand_decisions
    game = get_or_create_game()
    game.set_table_size(req.table_size)
    game.start_new_hand()
    current_hand_decisions = []
    game.play_ai_turns()
    return game.get_state_dict()

@router.post("/next-hand")
def next_hand():
    global active_game, current_hand_decisions
    game = get_or_create_game()
    game.start_new_hand()
    current_hand_decisions = []
    # If AI acts before hero, play AI turns
    game.play_ai_turns()
    return game.get_state_dict()

@router.post("/action")
def execute_player_action(req: PlayerActionRequest):
    global active_game, last_hand_review, current_hand_decisions
    game = get_or_create_game()

    if game.street in ("not_started", "hand_ended", "showdown"):
        raise HTTPException(status_code=400, detail="Hand has already finished. Deal next hand.")

    hero = game.players[0]
    if game.current_player_idx != 0:
        raise HTTPException(status_code=400, detail="Not hero's turn.")

    # Snapshot pre-action state for coaching evaluation
    legal = game.get_legal_actions(0)
    street = game.street
    position = hero.position_name
    pot_before = game.pot_manager.get_total_pot()
    call_amt = legal["call_amount"]

    # 1. Execute hero's chosen action
    try:
        game.execute_action(0, req.action, req.amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Evaluate hero's decision
    decision_analysis = analyze_user_decision(
        hole_cards=hero.hole_cards,
        board=game.community_cards,
        street=street,
        position=position,
        pot_size=pot_before,
        call_amount=call_amt,
        action_taken=req.action,
        action_amount=req.amount,
        stack_size=hero.chips,
        table_size=game.table_size
    )
    current_hand_decisions.append(decision_analysis)

    # 3. If hand not ended and it's AI turn, play AI turns
    ai_logs = []
    if game.street not in ("hand_ended", "showdown"):
        ai_logs = game.play_ai_turns()

    # 4. Check if hand concluded
    if game.street in ("hand_ended", "showdown"):
        hero_net = game.payouts.get("hero", 0) - hero.total_hand_bet
        won = game.payouts.get("hero", 0) > 0
        
        last_hand_review = generate_post_hand_review(
            hero_hole_cards=hero.hole_cards,
            board=game.community_cards,
            decisions=current_hand_decisions,
            payouts=game.payouts,
            hand_summary=game.hand_summary
        )

        # Record hand into SQLite stats
        record_completed_hand(
            hand_id=f"hand_{game.hand_number}_{game.game_id[:8]}",
            table_size=game.table_size,
            hero_position=hero.position_name,
            hero_cards=[str(c) for c in hero.hole_cards],
            board=[str(c) for c in game.community_cards],
            pot_total=game.pot_manager.get_total_pot(),
            hero_net_chips=hero_net,
            won_hand=won,
            actions_taken=[a.to_dict() for a in game.action_history],
            decisions=current_hand_decisions
        )

    res = game.get_state_dict()
    res["coaching_feedback"] = decision_analysis
    res["ai_turn_logs"] = ai_logs
    if game.street in ("hand_ended", "showdown"):
        res["hand_review"] = last_hand_review

    return res

@router.get("/hand-review")
def get_last_hand_review():
    global last_hand_review
    if last_hand_review is None:
        return {"has_review": False, "message": "No hand review available yet. Play a hand first."}
    return {"has_review": True, "review": last_hand_review}

