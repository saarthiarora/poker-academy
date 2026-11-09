from typing import Tuple, List, Union

RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
}
VALUE_TO_RANK = {v: k for k, v in RANK_VALUES.items() if k != '10'}
VALUE_TO_RANK[10] = 'T'

SUITS = {'s': '♠', 'h': '♥', 'd': '♦', 'c': '♣'}
SUIT_NAMES = {'s': 'Spades', 'h': 'Hearts', 'd': 'Diamonds', 'c': 'Clubs'}

class Card:
    __slots__ = ('rank', 'suit', '_str', '_val_tuple')

    def __init__(self, rank: Union[int, str], suit: str):
        if isinstance(rank, str):
            r = rank.upper()
            if r not in RANK_VALUES:
                raise ValueError(f"Invalid rank: {rank}")
            self.rank = RANK_VALUES[r]
        else:
            if rank < 2 or rank > 14:
                raise ValueError(f"Rank must be between 2 and 14, got {rank}")
            self.rank = rank
            
        s = suit.lower()
        if s not in SUITS:
            raise ValueError(f"Invalid suit: {suit}")
        self.suit = s
        
        self._str = f"{VALUE_TO_RANK[self.rank]}{self.suit}"
        self._val_tuple = (self.rank, self.suit)

    @classmethod
    def from_str(cls, card_str: str) -> "Card":
        s = card_str.strip()
        if not s:
            raise ValueError("Empty card string")
        if len(s) == 3 and s[:2] == '10':
            return cls(10, s[2])
        if len(s) == 2:
            return cls(s[0], s[1])
        raise ValueError(f"Invalid card string: '{card_str}'")

    @property
    def symbol(self) -> str:
        return SUITS[self.suit]

    @property
    def display_rank(self) -> str:
        return VALUE_TO_RANK[self.rank]

    @property
    def is_red(self) -> bool:
        return self.suit in ('h', 'd')

    def to_dict(self) -> dict:
        return {
            "rank": self.rank,
            "rank_char": VALUE_TO_RANK[self.rank],
            "suit": self.suit,
            "symbol": self.symbol,
            "code": self._str,
            "is_red": self.is_red
        }

    def __repr__(self) -> str:
        return self._str

    def __str__(self) -> str:
        return self._str

    def __eq__(self, other) -> bool:
        if isinstance(other, Card):
            return self._val_tuple == other._val_tuple
        return False

    def __hash__(self) -> int:
        return hash(self._val_tuple)

    def __lt__(self, other) -> bool:
        if isinstance(other, Card):
            return self.rank < other.rank
        return NotImplemented


def parse_cards(cards_input: Union[str, List[Union[str, Card]]]) -> List[Card]:
    if isinstance(cards_input, str):
        # Handle comma or space separated strings, e.g. "Ah, Kd, Qs" or "Ah Kd Qs"
        cleaned = cards_input.replace(',', ' ').replace(';', ' ')
        tokens = [t.strip() for t in cleaned.split() if t.strip()]
        return [Card.from_str(t) for t in tokens]
    elif isinstance(cards_input, list):
        res = []
        for item in cards_input:
            if isinstance(item, Card):
                res.append(item)
            else:
                res.append(Card.from_str(str(item)))
        return res
    return []

