from typing import List, Dict, Set, Tuple, Optional
from collections import defaultdict
from .hand_evaluator import HandEvaluation

class Pot:
    def __init__(self, amount: int, eligible_player_ids: Set[str]):
        self.amount = amount
        self.eligible_player_ids = set(eligible_player_ids)
        self.winners: List[str] = []
        self.payouts: Dict[str, int] = defaultdict(int)

    def to_dict(self) -> dict:
        return {
            "amount": self.amount,
            "eligible_player_ids": list(self.eligible_player_ids),
            "winners": self.winners,
            "payouts": dict(self.payouts)
        }

class PotManager:
    """
    Manages total contributions per player per hand, handles uncalled bet refunds,
    constructs main pot and side pots, and resolves payouts based on hand evaluations.
    """
    def __init__(self):
        # player_id -> total chips contributed to hand
        self.contributions: Dict[str, int] = defaultdict(int)
        # player_id -> whether player has folded
        self.folded: Set[str] = set()

    def add_contribution(self, player_id: str, amount: int):
        if amount > 0:
            self.contributions[player_id] += amount

    def player_folded(self, player_id: str):
        self.folded.add(player_id)

    def get_total_pot(self) -> int:
        return sum(self.contributions.values())

    def refund_uncalled_bets(self) -> Dict[str, int]:
        """
        If the highest active (non-folded) bettor contributed more than the second-highest
        active contribution, the difference is uncalled and refunded.
        Returns dict of player_id -> refund_amount.
        """
        refunds: Dict[str, int] = {}
        active_contribs = [(pid, amt) for pid, amt in self.contributions.items() if pid not in self.folded and amt > 0]
        if not active_contribs:
            return refunds

        active_contribs.sort(key=lambda x: x[1], reverse=True)
        if len(active_contribs) == 1:
            # Everyone else folded, no refund needed from pot unless single bettor put in more than was called
            # In Texas Hold'em, if everyone folds, the last remaining player wins the entire pot
            return refunds

        highest_pid, highest_amt = active_contribs[0]
        second_highest_amt = active_contribs[1][1]

        if highest_amt > second_highest_amt:
            refund = highest_amt - second_highest_amt
            self.contributions[highest_pid] -= refund
            refunds[highest_pid] = refund

        return refunds

    def calculate_pots(self) -> List[Pot]:
        """
        Builds the main pot and side pots based on contribution tiers.
        """
        # First ensure uncalled bets are refunded
        self.refund_uncalled_bets()

        # Get all non-zero contributions
        contribs = {pid: amt for pid, amt in self.contributions.items() if amt > 0}
        if not contribs:
            return []

        # Find distinct contribution levels of active (non-folded) players
        active_contrib_levels = sorted({amt for pid, amt in contribs.items() if pid not in self.folded})
        if not active_contrib_levels:
            # If all are folded (shouldn't happen in valid showdown), just one pot
            return [Pot(sum(contribs.values()), set(contribs.keys()))]

        pots: List[Pot] = []
        prev_level = 0
        current_remaining = dict(contribs)

        for level in active_contrib_levels:
            slice_amount = level - prev_level
            if slice_amount <= 0:
                continue

            pot_amt = 0
            eligible: Set[str] = set()

            for pid, amt in current_remaining.items():
                if amt > 0:
                    taken = min(amt, slice_amount)
                    pot_amt += taken
                    current_remaining[pid] -= taken
                    if pid not in self.folded and self.contributions[pid] >= level:
                        eligible.add(pid)

            if pot_amt > 0:
                pots.append(Pot(pot_amt, eligible))
            prev_level = level

        # If any dead money remains (e.g. from folded players who contributed more than active players)
        # distribute into the highest existing pot
        remaining_dead = sum(current_remaining.values())
        if remaining_dead > 0 and pots:
            pots[-1].amount += remaining_dead

        return pots

    def resolve_showdown(
        self,
        evaluations: Dict[str, HandEvaluation],
        position_order: List[str]
    ) -> Tuple[List[Pot], Dict[str, int]]:
        """
        Resolves winners for each pot and returns:
        - List of Pots with winners and payouts
        - Overall payouts dict {player_id: total_won}
        """
        pots = self.calculate_pots()
        total_payouts: Dict[str, int] = defaultdict(int)

        for pot in pots:
            # Filter eligible players who have evaluations and haven't folded
            candidates = [pid for pid in pot.eligible_player_ids if pid in evaluations and pid not in self.folded]
            if not candidates:
                # If no eligible non-folded player (e.g. edge case), fallback to any non-folded player
                active_players = [pid for pid in position_order if pid not in self.folded]
                candidates = active_players if active_players else list(pot.eligible_player_ids)

            if not candidates:
                continue

            # Find best evaluation among candidates
            best_eval: Optional[HandEvaluation] = None
            winners: List[str] = []

            for pid in candidates:
                ev = evaluations[pid]
                if best_eval is None or ev > best_eval:
                    best_eval = ev
                    winners = [pid]
                elif ev == best_eval:
                    winners.append(pid)

            pot.winners = winners
            n_winners = len(winners)
            share = pot.amount // n_winners
            remainder = pot.amount % n_winners

            for w in winners:
                pot.payouts[w] += share
                total_payouts[w] += share

            # Distribute remainder chip by position order starting left of button
            if remainder > 0:
                for pid in position_order:
                    if pid in winners and remainder > 0:
                        pot.payouts[pid] += 1
                        total_payouts[pid] += 1
                        remainder -= 1

        return pots, total_payouts

