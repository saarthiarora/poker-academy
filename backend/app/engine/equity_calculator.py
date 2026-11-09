import random
from typing import List, Dict, Optional, Tuple, Set, Union
from collections import defaultdict
from .card import Card, parse_cards
from .hand_evaluator import evaluate_hand

class EquityResult:
    def __init__(self, player_id: str, label: str):
        self.player_id = player_id
        self.label = label
        self.wins: int = 0
        self.ties: int = 0
        self.losses: int = 0
        self.hand_types: Dict[str, int] = defaultdict(int)

    def to_dict(self, total_sims: int) -> dict:
        equity = (self.wins + self.ties * 0.5) / total_sims if total_sims > 0 else 0.0
        return {
            "player_id": self.player_id,
            "label": self.label,
            "wins": self.wins,
            "ties": self.ties,
            "losses": self.losses,
            "win_pct": round((self.wins / total_sims) * 100, 2) if total_sims > 0 else 0,
            "tie_pct": round((self.ties / total_sims) * 100, 2) if total_sims > 0 else 0,
            "loss_pct": round((self.losses / total_sims) * 100, 2) if total_sims > 0 else 0,
            "equity_pct": round(equity * 100, 2),
            "hand_types": {k: round((v / total_sims) * 100, 1) for k, v in self.hand_types.items()}
        }

def run_equity_simulation(
    players_hands: List[Dict], # [{"id": "hero", "label": "Hero", "cards": ["As", "Ks"]}, ...]
    board_cards: List[Union[str, Card]],
    num_simulations: int = 10000,
    seed: Optional[int] = None
) -> Dict:
    """
    Executes Monte Carlo simulation to compute accurate Texas Hold'em equity.
    """
    rng = random.Random(seed)
    parsed_board = parse_cards(board_cards) if board_cards else []
    
    # Track all fixed cards to prevent duplication
    used_cards: Set[Card] = set(parsed_board)
    player_slots = []
    
    for p in players_hands:
        p_id = p.get("id", f"p_{len(player_slots)}")
        p_label = p.get("label", p_id)
        raw_cards = p.get("cards", [])
        p_cards = parse_cards(raw_cards) if raw_cards else []
        for c in p_cards:
            if c in used_cards:
                raise ValueError(f"Duplicate card detected: {c}")
            used_cards.add(c)
        player_slots.append({
            "id": p_id,
            "label": p_label,
            "fixed_cards": p_cards,
            "result": EquityResult(p_id, p_label)
        })

    # Build the remaining deck of unused cards
    all_52_cards = [Card(r, s) for r in range(2, 15) for s in ('s', 'h', 'd', 'c')]
    remaining_deck = [c for c in all_52_cards if c not in used_cards]

    cards_needed_for_board = 5 - len(parsed_board)
    players_needing_cards = [p for p in player_slots if len(p["fixed_cards"]) < 2]

    # Pre-allocate indices for speed
    n_players = len(player_slots)
    deck_size = len(remaining_deck)

    for _ in range(num_simulations):
        # Sample needed cards from remaining deck
        # Total cards to draw: cards_needed_for_board + (2 - len(cards)) for each player
        total_draw = cards_needed_for_board + sum(2 - len(p["fixed_cards"]) for p in players_needing_cards)
        drawn = rng.sample(remaining_deck, total_draw)
        draw_idx = 0

        # Construct board
        sim_board = list(parsed_board)
        if cards_needed_for_board > 0:
            sim_board.extend(drawn[draw_idx : draw_idx + cards_needed_for_board])
            draw_idx += cards_needed_for_board

        # Construct player hands and evaluate
        scores = []
        best_score = None
        evals = []

        for p in player_slots:
            if len(p["fixed_cards"]) == 2:
                p_hole = p["fixed_cards"]
            elif len(p["fixed_cards"]) == 1:
                p_hole = [p["fixed_cards"][0], drawn[draw_idx]]
                draw_idx += 1
            else:
                p_hole = [drawn[draw_idx], drawn[draw_idx + 1]]
                draw_idx += 2

            ev = evaluate_hand(p_hole + sim_board)
            evals.append(ev)
            p["result"].hand_types[ev.category_name] += 1
            if best_score is None or ev.score > best_score:
                best_score = ev.score

        # Determine winners
        winner_indices = [i for i, ev in enumerate(evals) if ev.score == best_score]
        n_winners = len(winner_indices)

        for i, p in enumerate(player_slots):
            if i in winner_indices:
                if n_winners == 1:
                    p["result"].wins += 1
                else:
                    p["result"].ties += 1
            else:
                p["result"].losses += 1

    return {
        "num_simulations": num_simulations,
        "board": [c.to_dict() for c in parsed_board],
        "results": [p["result"].to_dict(num_simulations) for p in player_slots]
    }

