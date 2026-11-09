from typing import List, Tuple, Dict, Optional
from itertools import combinations
from collections import Counter
from .card import Card, VALUE_TO_RANK

HAND_CATEGORIES = {
    8: "Straight Flush",
    7: "Four of a Kind",
    6: "Full House",
    5: "Flush",
    4: "Straight",
    3: "Three of a Kind",
    2: "Two Pair",
    1: "One Pair",
    0: "High Card"
}

RANK_NAME_SINGULAR = {
    14: "Ace", 13: "King", 12: "Queen", 11: "Jack", 10: "Ten",
    9: "Nine", 8: "Eight", 7: "Seven", 6: "Six", 5: "Five",
    4: "Four", 3: "Three", 2: "Deuce"
}

RANK_NAME_PLURAL = {
    14: "Aces", 13: "Kings", 12: "Queens", 11: "Jacks", 10: "Tens",
    9: "Nines", 8: "Eights", 7: "Sevens", 6: "Sixes", 5: "Fives",
    4: "Fours", 3: "Threes", 2: "Deuces"
}

class HandEvaluation:
    def __init__(self, score: Tuple[int, ...], best_cards: List[Card], description: str):
        self.score = score
        self.category = score[0]
        self.category_name = HAND_CATEGORIES[score[0]]
        self.best_cards = best_cards
        self.description = description

    def __lt__(self, other: "HandEvaluation") -> bool:
        return self.score < other.score

    def __gt__(self, other: "HandEvaluation") -> bool:
        return self.score > other.score

    def __eq__(self, other: "HandEvaluation") -> bool:
        return self.score == other.score

    def to_dict(self) -> dict:
        return {
            "category": self.category,
            "category_name": self.category_name,
            "description": self.description,
            "best_cards": [c.to_dict() for c in self.best_cards],
            "score": list(self.score)
        }

    def __repr__(self) -> str:
        return f"<HandEvaluation: {self.description}>"


def _check_straight(ranks: List[int]) -> Optional[int]:
    """Check if distinct sorted ranks contain a straight. Returns high card of straight, or None. Handles Ace-low (5-4-3-2-A)."""
    unique_ranks = sorted(set(ranks), reverse=True)
    if len(unique_ranks) < 5:
        return None
    # Add 1 if Ace (14) is present for wheel
    ranks_with_wheel = list(unique_ranks)
    if 14 in ranks_with_wheel:
        ranks_with_wheel.append(1)

    for i in range(len(ranks_with_wheel) - 4):
        window = ranks_with_wheel[i:i+5]
        if window[0] - window[4] == 4 and len(window) == 5:
            return window[0]
    return None


def evaluate_5_cards(cards: List[Card]) -> HandEvaluation:
    """Evaluate exactly 5 cards."""
    if len(cards) != 5:
        raise ValueError("Must provide exactly 5 cards to evaluate_5_cards")

    ranks = sorted([c.rank for c in cards], reverse=True)
    suits = [c.suit for c in cards]
    is_flush = len(set(suits)) == 1

    straight_high = _check_straight(ranks)
    is_straight = straight_high is not None

    # Count rank frequencies
    rank_counts = Counter(ranks)
    # Sort by frequency descending, then rank descending
    sorted_by_freq = sorted(rank_counts.items(), key=lambda x: (x[1], x[0]), reverse=True)

    # 1. Straight Flush / Royal Flush
    if is_flush and is_straight:
        if straight_high == 14:
            desc = "Royal Flush"
        elif straight_high == 5:
            desc = "Straight Flush, Five high (Steel Wheel)"
        else:
            desc = f"Straight Flush, {RANK_NAME_SINGULAR[straight_high]} high"
        score = (8, straight_high)
        # Order cards by straight order
        if straight_high == 5 and 14 in ranks:
            # Ace is low
            sorted_cards = sorted(cards, key=lambda c: 1 if c.rank == 14 else c.rank, reverse=True)
        else:
            sorted_cards = sorted(cards, key=lambda c: c.rank, reverse=True)
        return HandEvaluation(score, sorted_cards, desc)

    # 2. Four of a kind
    if sorted_by_freq[0][1] == 4:
        quad_rank = sorted_by_freq[0][0]
        kicker = sorted_by_freq[1][0]
        desc = f"Four of a Kind, {RANK_NAME_PLURAL[quad_rank]} with {RANK_NAME_SINGULAR[kicker]} kicker"
        score = (7, quad_rank, kicker)
        sorted_cards = sorted(cards, key=lambda c: (c.rank == quad_rank, c.rank), reverse=True)
        return HandEvaluation(score, sorted_cards, desc)

    # 3. Full House
    if sorted_by_freq[0][1] == 3 and sorted_by_freq[1][1] == 2:
        trips = sorted_by_freq[0][0]
        pair = sorted_by_freq[1][0]
        desc = f"Full House, {RANK_NAME_PLURAL[trips]} full of {RANK_NAME_PLURAL[pair]}"
        score = (6, trips, pair)
        sorted_cards = sorted(cards, key=lambda c: (c.rank == trips, c.rank == pair), reverse=True)
        return HandEvaluation(score, sorted_cards, desc)

    # 4. Flush
    if is_flush:
        desc = f"Flush, {RANK_NAME_SINGULAR[ranks[0]]} high ({', '.join(RANK_NAME_SINGULAR[r] for r in ranks)})"
        score = (5, *ranks)
        sorted_cards = sorted(cards, key=lambda c: c.rank, reverse=True)
        return HandEvaluation(score, sorted_cards, desc)

    # 5. Straight
    if is_straight:
        if straight_high == 5:
            desc = "Straight, Five high (Wheel: A-2-3-4-5)"
            sorted_cards = sorted(cards, key=lambda c: 1 if c.rank == 14 else c.rank, reverse=True)
        else:
            desc = f"Straight, {RANK_NAME_SINGULAR[straight_high]} high"
            sorted_cards = sorted(cards, key=lambda c: c.rank, reverse=True)
        score = (4, straight_high)
        return HandEvaluation(score, sorted_cards, desc)

    # 6. Three of a kind
    if sorted_by_freq[0][1] == 3:
        trips = sorted_by_freq[0][0]
        k1 = sorted_by_freq[1][0]
        k2 = sorted_by_freq[2][0]
        desc = f"Three of a Kind, {RANK_NAME_PLURAL[trips]} ({RANK_NAME_SINGULAR[k1]}, {RANK_NAME_SINGULAR[k2]} kickers)"
        score = (3, trips, k1, k2)
        sorted_cards = sorted(cards, key=lambda c: (c.rank == trips, c.rank), reverse=True)
        return HandEvaluation(score, sorted_cards, desc)

    # 7. Two Pair
    if sorted_by_freq[0][1] == 2 and sorted_by_freq[1][1] == 2:
        high_pair = max(sorted_by_freq[0][0], sorted_by_freq[1][0])
        low_pair = min(sorted_by_freq[0][0], sorted_by_freq[1][0])
        kicker = sorted_by_freq[2][0]
        desc = f"Two Pair, {RANK_NAME_PLURAL[high_pair]} and {RANK_NAME_PLURAL[low_pair]} ({RANK_NAME_SINGULAR[kicker]} kicker)"
        score = (2, high_pair, low_pair, kicker)
        sorted_cards = sorted(cards, key=lambda c: (c.rank == high_pair, c.rank == low_pair, c.rank), reverse=True)
        return HandEvaluation(score, sorted_cards, desc)

    # 8. One Pair
    if sorted_by_freq[0][1] == 2:
        pair = sorted_by_freq[0][0]
        kickers = [sorted_by_freq[i][0] for i in range(1, 4)]
        k_desc = ", ".join(RANK_NAME_SINGULAR[k] for k in kickers)
        desc = f"Pair of {RANK_NAME_PLURAL[pair]} ({k_desc} kickers)"
        score = (1, pair, *kickers)
        sorted_cards = sorted(cards, key=lambda c: (c.rank == pair, c.rank), reverse=True)
        return HandEvaluation(score, sorted_cards, desc)

    # 9. High Card
    k_desc = ", ".join(RANK_NAME_SINGULAR[r] for r in ranks)
    desc = f"High Card, {RANK_NAME_SINGULAR[ranks[0]]} ({k_desc})"
    score = (0, *ranks)
    sorted_cards = sorted(cards, key=lambda c: c.rank, reverse=True)
    return HandEvaluation(score, sorted_cards, desc)


def evaluate_hand(cards: List[Card]) -> HandEvaluation:
    """Evaluate 5, 6, or 7 cards and find the absolute best 5-card combination."""
    n = len(cards)
    if n < 5:
        raise ValueError(f"Need at least 5 cards to evaluate, got {n}")
    if n == 5:
        return evaluate_5_cards(cards)

    # For 6 or 7 cards, test combinations of 5 cards
    best_eval: Optional[HandEvaluation] = None
    for combo in combinations(cards, 5):
        cur_eval = evaluate_5_cards(list(combo))
        if best_eval is None or cur_eval > best_eval:
            best_eval = cur_eval

    return best_eval

