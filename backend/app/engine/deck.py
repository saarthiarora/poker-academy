import random
from typing import List, Optional, Set
from .card import Card, VALUE_TO_RANK, SUITS

class Deck:
    def __init__(self, seed: Optional[int] = None):
        self.rng = random.Random(seed)
        self.cards: List[Card] = []
        self.reset()

    def reset(self):
        self.cards = [Card(r, s) for r in range(2, 15) for s in ('s', 'h', 'd', 'c')]

    def shuffle(self):
        self.rng.shuffle(self.cards)

    def deal(self, n: int = 1) -> List[Card]:
        if len(self.cards) < n:
            raise ValueError(f"Cannot deal {n} cards, only {len(self.cards)} left in deck")
        dealt = [self.cards.pop() for _ in range(n)]
        return dealt

    def remove_cards(self, cards_to_remove: List[Card]):
        to_remove_set: Set[Card] = set(cards_to_remove)
        self.cards = [c for c in self.cards if c not in to_remove_set]

    @property
    def remaining(self) -> int:
        return len(self.cards)

    def __len__(self) -> int:
        return len(self.cards)

