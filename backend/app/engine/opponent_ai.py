import random
from typing import List, Dict, Optional, Tuple
from .card import Card, VALUE_TO_RANK
from .hand_evaluator import evaluate_hand, HandEvaluation

PERSONALITY_PROFILES = {
    "tight_passive": {
        "name_tag": "The Rock",
        "description": "Plays only premium cards. Rarely raises or bluffs; checks and calls with made hands.",
        "vpip_threshold": 0.16,
        "pfr_ratio": 0.40,
        "cbet_freq": 0.45,
        "probe_freq": 0.25,
        "bluff_freq": 0.08,
        "fold_to_raise": 0.70,
        "aggression": 0.30
    },
    "tight_aggressive": {
        "name_tag": "TAG Master",
        "description": "Selective with starting hands, but plays them aggressively with high pressure and c-bets.",
        "vpip_threshold": 0.24,
        "pfr_ratio": 0.85,
        "cbet_freq": 0.75,
        "probe_freq": 0.60,
        "bluff_freq": 0.25,
        "fold_to_raise": 0.50,
        "aggression": 0.80
    },
    "loose_aggressive": {
        "name_tag": "LAG Maverick",
        "description": "Plays wide ranges, applies maximum pressure with frequent bets, raises, and bluffs.",
        "vpip_threshold": 0.42,
        "pfr_ratio": 0.80,
        "cbet_freq": 0.85,
        "probe_freq": 0.75,
        "bluff_freq": 0.40,
        "fold_to_raise": 0.35,
        "aggression": 0.88
    },
    "loose_passive": {
        "name_tag": "Calling Station",
        "description": "Enters many pots and hates folding any piece of the board, but rarely takes the initiative to raise.",
        "vpip_threshold": 0.48,
        "pfr_ratio": 0.25,
        "cbet_freq": 0.35,
        "probe_freq": 0.20,
        "bluff_freq": 0.08,
        "fold_to_raise": 0.20,
        "aggression": 0.20
    },
    "balanced": {
        "name_tag": "GTO Strategist",
        "description": "Calculates pot odds, mixes value bets with balanced bluffs, and adapts to table dynamics.",
        "vpip_threshold": 0.28,
        "pfr_ratio": 0.75,
        "cbet_freq": 0.68,
        "probe_freq": 0.55,
        "bluff_freq": 0.28,
        "fold_to_raise": 0.45,
        "aggression": 0.65
    }
}

DEFAULT_AI_PROFILES = [
    {"id": "ai_1", "name": "Viktor Stone", "personality": "tight_passive", "avatar": "🗿"},
    {"id": "ai_2", "name": "Elena Rostova", "personality": "tight_aggressive", "avatar": "🦊"},
    {"id": "ai_3", "name": "Marcus Vance", "personality": "loose_aggressive", "avatar": "🌪️"},
    {"id": "ai_4", "name": "Sammy Green", "personality": "loose_passive", "avatar": "🦥"},
    {"id": "ai_5", "name": "Sophia Chen", "personality": "balanced", "avatar": "🤖"},
    {"id": "ai_6", "name": "Diana Sterling", "personality": "tight_aggressive", "avatar": "💎"},
    {"id": "ai_7", "name": "Lucas Drake", "personality": "loose_aggressive", "avatar": "⚡"},
    {"id": "ai_8", "name": "Oliver Finch", "personality": "balanced", "avatar": "🎯"}
]

def get_preflop_score(hole_cards: List[Card]) -> float:
    """Returns a baseline normalized hand strength score between 0.0 and 1.0."""
    if len(hole_cards) != 2:
        return 0.0
    c1, c2 = hole_cards[0], hole_cards[1]
    high = max(c1.rank, c2.rank)
    low = min(c1.rank, c2.rank)
    is_pair = high == low
    is_suited = c1.suit == c2.suit
    gap = high - low

    # Pocket pairs: AA (1.0), KK (0.95), ..., 22 (0.45)
    if is_pair:
        return 0.42 + (high / 14.0) * 0.58

    # Non-pairs
    base = (high * 3.5 + low * 2.0) / 77.0
    if is_suited:
        base += 0.09
    if gap == 1:
        base += 0.05
    elif gap == 2:
        base += 0.02
    elif gap >= 4:
        base -= 0.05

    return max(0.05, min(0.98, base))

def evaluate_postflop_strength(hole_cards: List[Card], board: List[Card]) -> Tuple[float, str, bool, bool]:
    """
    Evaluates relative strength of hole cards on current board.
    Returns: (strength_score 0.0 to 1.0, description, has_flush_draw, has_straight_draw).
    """
    if not board:
        return get_preflop_score(hole_cards), "Preflop", False, False

    combined = hole_cards + board
    eval_res = evaluate_hand(combined)
    cat = eval_res.category

    # Base score by category
    category_scores = {
        8: 1.0,  # Straight Flush
        7: 0.98, # Four of a kind
        6: 0.95, # Full House
        5: 0.90, # Flush
        4: 0.85, # Straight
        3: 0.78, # Three of a kind (Trips/Set)
        2: 0.68, # Two Pair
        1: 0.52, # One Pair (baseline)
        0: 0.25  # High Card
    }
    score = category_scores.get(cat, 0.25)

    board_ranks = sorted([c.rank for c in board], reverse=True)
    top_board = board_ranks[0]

    # Detailed pair evaluation:
    if cat == 1:
        pair_rank = eval_res.score[1]
        kicker_rank = eval_res.score[2] if len(eval_res.score) > 2 else 0

        if pair_rank > top_board:
            # Overpair to the board (e.g. KK on J-8-3) -> Strong value!
            score = 0.72 + (kicker_rank / 14.0) * 0.05
        elif pair_rank == top_board:
            # Top pair -> Very playable value!
            score = 0.64 + (kicker_rank / 14.0) * 0.08
        elif len(board_ranks) > 1 and pair_rank >= board_ranks[1]:
            # Second / Middle pair
            score = 0.50 + (kicker_rank / 14.0) * 0.04
        else:
            # Bottom pair / underpair
            score = 0.40

    # Two Pair evaluation
    elif cat == 2:
        # Top two pair vs bottom two pair
        score = 0.68 + (eval_res.score[1] / 14.0) * 0.06

    # Check draws on flop and turn
    has_flush_draw = False
    has_straight_draw = False

    if len(board) < 5:
        # Flush draw check
        suits = [c.suit for c in combined]
        suit_counts = {s: suits.count(s) for s in set(suits)}
        for s, count in suit_counts.items():
            if count == 4:
                # Check if at least one hole card has this suit
                if any(c.suit == s for c in hole_cards):
                    has_flush_draw = True
                    score += 0.16 # High equity semi-bluff potential!

        # Straight draw check: 4 consecutive ranks
        ranks_set = set(c.rank for c in combined)
        if 14 in ranks_set:
            ranks_set.add(1) # Ace low
        sorted_ranks = sorted(ranks_set)
        for i in range(len(sorted_ranks) - 3):
            sub = sorted_ranks[i:i+4]
            if sub[-1] - sub[0] <= 4:
                has_straight_draw = True
                score += 0.12 # Open ended or gutshot
                break

    return max(0.05, min(1.0, score)), eval_res.description, has_flush_draw, has_straight_draw

class OpponentAI:
    def __init__(self, profile_id: str, name: str, personality: str, avatar: str = "👤"):
        self.id = profile_id
        self.name = name
        self.personality_type = personality if personality in PERSONALITY_PROFILES else "balanced"
        self.personality = PERSONALITY_PROFILES[self.personality_type]
        self.avatar = avatar

    def decide_action(
        self,
        hole_cards: List[Card],
        board: List[Card],
        current_pot: int,
        call_amount: int,
        min_raise: int,
        player_stack: int,
        position_name: str,
        active_players_count: int,
        street: str
    ) -> Tuple[str, int, str]:
        """
        Determines the AI's action.
        Returns: (action: 'fold' | 'check' | 'call' | 'raise' | 'all_in', amount: int, reasoning: str)
        """
        rng = random.random()
        cfg = self.personality

        can_check = (call_amount == 0)

        # Pot odds required to call
        if call_amount > 0:
            pot_odds = call_amount / (current_pot + call_amount)
        else:
            pot_odds = 0.0

        # Position bonus
        pos_bonus = 0.0
        if position_name in ("BTN", "Button"):
            pos_bonus = 0.08
        elif position_name in ("CO", "Cutoff", "HJ"):
            pos_bonus = 0.04
        elif position_name in ("UTG", "UTG+1"):
            pos_bonus = -0.05

        # 1. PREFLOP DECISION
        if street == "preflop":
            raw_strength = get_preflop_score(hole_cards)
            adj_strength = raw_strength + pos_bonus
            vpip_cut = 1.0 - cfg["vpip_threshold"]

            # Facing a bet/raise preflop
            if call_amount > 0:
                required_str = vpip_cut + 0.08
                if adj_strength >= required_str + 0.14:
                    # 3-Bet / Re-raise
                    if rng < cfg["pfr_ratio"] and player_stack > min_raise:
                        target = min(player_stack, max(min_raise, call_amount * 3))
                        return "raise", target, f"{self.name} ({cfg['name_tag']}) raises with premium holding {hole_cards}"
                    return "call", min(player_stack, call_amount), f"{self.name} calls with strong holding"
                elif adj_strength >= required_str:
                    # Call or fold
                    if rng > cfg["fold_to_raise"]:
                        return "call", min(player_stack, call_amount), f"{self.name} defends position with {hole_cards}"
                    return "fold", 0, f"{self.name} folds to raise"
                else:
                    # Occasional light 3-bet bluff
                    if cfg["bluff_freq"] > 0.20 and rng < 0.15 and player_stack > min_raise:
                        target = min(player_stack, max(min_raise, call_amount * 3))
                        return "raise", target, f"{self.name} fires a light 3-bet bluff"
                    return "fold", 0, f"{self.name} folds weak preflop holding"
            else:
                # Unopened pot: Open raise or check
                if adj_strength >= vpip_cut:
                    if rng < cfg["pfr_ratio"] and player_stack >= min_raise:
                        target = min(player_stack, max(min_raise, 40)) # Standard 2x-3x open
                        return "raise", target, f"{self.name} opens pot with strong range"
                    elif can_check:
                        return "check", 0, f"{self.name} checks"
                    else:
                        return "call", min(player_stack, call_amount), f"{self.name} enters pot"
                else:
                    if can_check:
                        return "check", 0, f"{self.name} checks in Big Blind"
                    return "fold", 0, f"{self.name} folds"

        # 2. POSTFLOP DECISION (Flop, Turn, River)
        strength, desc, has_flush_draw, has_straight_draw = evaluate_postflop_strength(hole_cards, board)
        effective_str = strength + pos_bonus * 0.4

        # Bet sizing helper based on pot
        def get_bet_size(pct: float) -> int:
            calculated = int(max(current_pot, 40) * pct)
            return min(player_stack, max(min_raise, calculated))

        # A. Facing a Bet from Opponent (call_amount > 0)
        if call_amount > 0:
            # Monster hands (>= 0.78): Raise for value
            if effective_str >= 0.78:
                if rng < cfg["aggression"]:
                    raise_amt = min(player_stack, max(min_raise, call_amount * 2 + int(current_pot * 0.5)))
                    return "raise", raise_amt, f"{self.name} raises for value with {desc}"
                return "call", min(player_stack, call_amount), f"{self.name} calls to slowplay monster {desc}"

            # Strong made hands (0.60 - 0.77): Top pair, overpair, two pair
            if effective_str >= 0.60:
                if rng < cfg["aggression"] * 0.4 and player_stack > min_raise:
                    raise_amt = min(player_stack, max(min_raise, call_amount * 2))
                    return "raise", raise_amt, f"{self.name} value-raises with {desc}"
                return "call", min(player_stack, call_amount), f"{self.name} calls with {desc}"

            # Medium / Drawing hands (0.40 - 0.59): Middle pair, flush draw, straight draw
            if effective_str >= 0.40:
                # Check pot odds
                if pot_odds < 0.32 or has_flush_draw or (has_straight_draw and pot_odds < 0.25):
                    # Semi-bluff raise occasionally if aggressive
                    if (has_flush_draw or has_straight_draw) and rng < cfg["bluff_freq"] and player_stack > min_raise:
                        raise_amt = min(player_stack, max(min_raise, call_amount * 2))
                        return "raise", raise_amt, f"{self.name} semi-bluffs with strong draw"
                    return "call", min(player_stack, call_amount), f"{self.name} calls with {desc}"
                # Fold if pot odds are unfavorable
                if rng < cfg["fold_to_raise"]:
                    return "fold", 0, f"{self.name} folds marginal holding to pressure"
                return "call", min(player_stack, call_amount), f"{self.name} floats bet"

            # Weak hands (< 0.40):
            # Calling station calls small bets
            if self.personality_type == "loose_passive" and call_amount <= player_stack * 0.05 and pot_odds < 0.20:
                return "call", min(player_stack, call_amount), f"{self.name} calls down lightly"
            return "fold", 0, f"{self.name} folds weak hand"

        # B. Unopened Pot / Checked to this AI (can_check is True)
        # NEVER "always check"! Attack weakness, value bet made hands, and continuation-bet!

        # 1. Monster hands (>= 0.78): Value bet large
        if effective_str >= 0.78:
            bet_size = get_bet_size(random.choice([0.66, 0.75, 1.0]))
            return "raise", bet_size, f"{self.name} value-bets monster holding {desc}"

        # 2. Strong Hands (0.60 - 0.77): Top pair, Overpair, Two pair -> Value bet with high frequency!
        if effective_str >= 0.60:
            if rng < max(0.65, cfg["cbet_freq"]):
                bet_size = get_bet_size(random.choice([0.40, 0.50, 0.66]))
                return "raise", bet_size, f"{self.name} bets for value with {desc}"
            return "check", 0, f"{self.name} checks to control pot with {desc}"

        # 3. Medium Hands / Draws (0.42 - 0.59): Second pair, strong draws -> Bet or probe frequently!
        if effective_str >= 0.42:
            # If has draw or aggressive personality, bet!
            if has_flush_draw or has_straight_draw:
                if rng < max(0.55, cfg["aggression"]):
                    bet_size = get_bet_size(random.choice([0.33, 0.50]))
                    return "raise", bet_size, f"{self.name} bets semi-bluff on draw"
                return "check", 0, f"{self.name} checks drawing hand"

            # Made pair: probe bet when checked to!
            if rng < cfg["probe_freq"]:
                bet_size = get_bet_size(0.33)
                return "raise", bet_size, f"{self.name} fires probe bet with {desc}"
            return "check", 0, f"{self.name} checks"

        # 4. Weak / Air hands (< 0.42):
        # Fire continuation bet or positional stab if aggressive
        if street == "flop":
            # Flop c-bet / bluff chance
            if rng < cfg["cbet_freq"] * 0.60:
                bet_size = get_bet_size(0.33)
                return "raise", bet_size, f"{self.name} continuation-bets flop with range advantage"
            return "check", 0, f"{self.name} checks"

        elif street in ("turn", "river"):
            # Probe bet if everyone checked flop
            if rng < cfg["bluff_freq"] * 0.70:
                bet_size = get_bet_size(random.choice([0.50, 0.66]))
                return "raise", bet_size, f"{self.name} attacks checked weakness with a bluff"
            return "check", 0, f"{self.name} checks"

        return "check", 0, f"{self.name} checks"
