import random
from typing import Dict, List, Any, Optional
from app.engine.card import Card, parse_cards
from app.engine.equity_calculator import run_equity_simulation
from app.engine.hand_evaluator import evaluate_hand
from app.services.range_service import get_169_hands_grid

PRESET_RANGES = {
    "top_5": ["AA", "KK", "QQ", "AKs", "AKo"],
    "top_10": ["AA", "KK", "QQ", "JJ", "TT", "AKs", "AQs", "AJs", "KQs", "AKo", "AQo"],
    "top_20": [
        "AA", "KK", "QQ", "JJ", "TT", "99", "88", "77",
        "AKs", "AQs", "AJs", "ATs", "A5s", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs", "T9s",
        "AKo", "AQo", "AJo", "ATo", "KQo", "KJo"
    ],
    "pocket_pairs": ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22"],
    "broadways": [
        "AKs", "AQs", "AJs", "ATs", "KQs", "KJs", "KTs", "QJs", "QTs", "JTs",
        "AKo", "AQo", "AJo", "ATo", "KQo", "KJo", "KTo", "QJo", "QTo", "JTo"
    ],
    "suited_connectors": ["AKs", "KQs", "QJs", "JTs", "T9s", "98s", "87s", "76s", "65s", "54s"]
}

def expand_hand_notation_to_combos(hand_notation: str, dead_cards: List[Card]) -> List[List[Card]]:
    """
    Expands a hand notation like 'AKs', 'AA', or 'AKo' into all valid 2-card combinations
    excluding any dead cards.
    """
    dead_set = set(dead_cards)
    ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
    suits = ['s', 'h', 'd', 'c']
    
    r1 = hand_notation[0]
    r2 = hand_notation[1]
    is_pair = (r1 == r2)
    is_suited = hand_notation.endswith("s")
    is_offsuit = hand_notation.endswith("o") or (not is_pair and not is_suited)

    combos = []

    if is_pair:
        # 6 combos
        for i in range(len(suits)):
            for j in range(i + 1, len(suits)):
                c1 = Card(r1, suits[i])
                c2 = Card(r2, suits[j])
                if c1 not in dead_set and c2 not in dead_set:
                    combos.append([c1, c2])
    elif is_suited:
        # 4 suited combos
        for s in suits:
            c1 = Card(r1, s)
            c2 = Card(r2, s)
            if c1 not in dead_set and c2 not in dead_set:
                combos.append([c1, c2])
    else:
        # 12 offsuit combos
        for s1 in suits:
            for s2 in suits:
                if s1 != s2:
                    c1 = Card(r1, s1)
                    c2 = Card(r2, s2)
                    if c1 not in dead_set and c2 not in dead_set:
                        combos.append([c1, c2])
                        
    return combos

def simulate_hand_vs_hand(
    hand1_cards: List[str],
    hand2_cards: List[str],
    board_cards: Optional[List[str]] = None,
    simulations: int = 5000
) -> Dict[str, Any]:
    players = [
        {"id": "hand1", "label": "Hand 1", "cards": hand1_cards},
        {"id": "hand2", "label": "Hand 2", "cards": hand2_cards}
    ]
    return run_equity_simulation(players, board_cards or [], num_simulations=simulations)

def simulate_hand_vs_range(
    hero_cards: List[str],
    range_name_or_list: Any,
    board_cards: Optional[List[str]] = None,
    simulations: int = 5000
) -> Dict[str, Any]:
    parsed_hero = parse_cards(hero_cards)
    parsed_board = parse_cards(board_cards) if board_cards else []
    dead = parsed_hero + parsed_board

    # Resolve range list
    if isinstance(range_name_or_list, str) and range_name_or_list in PRESET_RANGES:
        range_notations = PRESET_RANGES[range_name_or_list]
    elif isinstance(range_name_or_list, list):
        range_notations = range_name_or_list
    else:
        range_notations = PRESET_RANGES["top_10"]

    # Gather all combos in range
    all_combos = []
    for notation in range_notations:
        combos = expand_hand_notation_to_combos(notation, dead)
        all_combos.extend(combos)

    if not all_combos:
        raise ValueError("No valid card combinations found for the specified range after removing dead cards.")

    # Run Monte Carlo sampling across range combos
    rng = random.Random()
    hero_wins = 0
    hero_ties = 0
    hero_losses = 0

    all_52 = [Card(r, s) for r in range(2, 15) for s in ('s', 'h', 'd', 'c')]

    for _ in range(simulations):
        # Pick random combo from range
        villain_combo = rng.choice(all_combos)
        used_this_run = set(dead + villain_combo)
        remaining = [c for c in all_52 if c not in used_this_run]

        # Complete board to 5 cards
        needed_board = 5 - len(parsed_board)
        drawn = rng.sample(remaining, needed_board) if needed_board > 0 else []
        sim_board = parsed_board + drawn

        hero_eval = evaluate_hand(parsed_hero + sim_board)
        villain_eval = evaluate_hand(villain_combo + sim_board)

        if hero_eval > villain_eval:
            hero_wins += 1
        elif villain_eval > hero_eval:
            hero_losses += 1
        else:
            hero_ties += 1

    hero_equity = (hero_wins + hero_ties * 0.5) / simulations * 100
    villain_equity = (hero_losses + hero_ties * 0.5) / simulations * 100

    return {
        "num_simulations": simulations,
        "hero_cards": hero_cards,
        "range_notations": range_notations,
        "combos_count": len(all_combos),
        "board": [c.to_dict() for c in parsed_board],
        "hero": {
            "win_pct": round((hero_wins / simulations) * 100, 2),
            "tie_pct": round((hero_ties / simulations) * 100, 2),
            "loss_pct": round((hero_losses / simulations) * 100, 2),
            "equity_pct": round(hero_equity, 2)
        },
        "villain": {
            "win_pct": round((hero_losses / simulations) * 100, 2),
            "tie_pct": round((hero_ties / simulations) * 100, 2),
            "loss_pct": round((hero_wins / simulations) * 100, 2),
            "equity_pct": round(villain_equity, 2)
        }
    }

DECISION_QUIZ_SCENARIOS = [
    {
        "id": "quiz_1",
        "title": "Button RFI with Suited Ace",
        "hero_cards": ["As", "5s"],
        "board": [],
        "street": "Preflop",
        "position": "BTN",
        "pot_size": 30,
        "call_amount": 0,
        "scenario": "Everyone folds to you on the Button in a 6-max 100bb cash game. Blinds are $10/$20.",
        "options": [
            {"action": "raise", "label": "Raise to 2.5 BB ($50)", "is_correct": True, "explanation": "Correct! A5s is a premium opening hand on the Button. It has wheel straight potential, nut flush potential, and blocks opponent Aces."},
            {"action": "call", "label": "Limp / Call $20", "is_correct": False, "explanation": "Suboptimal. Open-limping on the Button gives the blinds free equity and surrenders preflop initiative."},
            {"action": "fold", "label": "Fold", "is_correct": False, "explanation": "Major mistake! Folding A5s on the Button is giving up significant positive expected value (+EV)."}
        ]
    },
    {
        "id": "quiz_2",
        "title": "Flopped Nut Flush Draw vs C-Bet",
        "hero_cards": ["As", "Ks"],
        "board": ["8s", "7s", "2d"],
        "street": "Flop",
        "position": "BB",
        "pot_size": 150,
        "call_amount": 75,
        "scenario": "You defended the Big Blind against a Button open. The flop is 8♠ 7♠ 2♦. The Button bets half-pot ($75 into $150).",
        "options": [
            {"action": "raise", "label": "Check-Raise to $225", "is_correct": True, "explanation": "Excellent! You have 9 nut flush outs plus 6 overcard outs (15 total outs = ~54% equity). A check-raise generates immense fold equity and semi-bluff power."},
            {"action": "call", "label": "Call $75", "is_correct": True, "explanation": "Solid play. Calling with 15 outs closing action is clearly +EV and keeps all villain's weaker hands in the pot."},
            {"action": "fold", "label": "Fold", "is_correct": False, "explanation": "Disastrous fold! You are a favorite or coin-flip against almost any single pair with huge redraws to the nuts."}
        ]
    },
    {
        "id": "quiz_3",
        "title": "Facing River Raise with Top Pair Weak Kicker",
        "hero_cards": ["Kd", "8d"],
        "board": ["Kh", "Jc", "4s", "2c", "9h"],
        "street": "River",
        "position": "HJ",
        "pot_size": 400,
        "call_amount": 350,
        "scenario": "You bet $150 on the river with top pair eight kicker, and an ultra-tight opponent (The Rock) raises to $500.",
        "options": [
            {"action": "fold", "label": "Fold", "is_correct": True, "explanation": "Disciplined fold! Tight-passive players almost never raise rivers as a bluff. Your K8 is crushed by KQ, KJ, two pairs, or sets."},
            {"action": "call", "label": "Call $350", "is_correct": False, "explanation": "Major mistake. Calling a big river raise from a tight passive player with one pair weak kicker burns chips."},
            {"action": "raise", "label": "All-in Shove", "is_correct": False, "explanation": "Blunder! You isolate yourself against only hands that beat you."}
        ]
    }
]

def get_random_quiz_scenario() -> Dict[str, Any]:
    return random.choice(DECISION_QUIZ_SCENARIOS)

