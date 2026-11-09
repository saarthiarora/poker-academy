from typing import List, Dict, Optional, Tuple, Set
import uuid
from .card import Card, parse_cards
from .deck import Deck
from .hand_evaluator import evaluate_hand, HandEvaluation
from .pot_manager import PotManager, Pot
from .opponent_ai import OpponentAI, DEFAULT_AI_PROFILES

class Player:
    def __init__(
        self,
        player_id: str,
        name: str,
        chips: int,
        is_human: bool = False,
        personality: str = "balanced",
        avatar: str = "👤"
    ):
        self.id = player_id
        self.name = name
        self.chips = chips
        self.initial_hand_chips = chips
        self.is_human = is_human
        self.personality = personality
        self.avatar = avatar
        
        # Per-hand state
        self.hole_cards: List[Card] = []
        self.folded: bool = False
        self.is_all_in: bool = False
        self.current_bet: int = 0
        self.total_hand_bet: int = 0
        self.has_acted: bool = False
        self.position_name: str = ""
        self.evaluation: Optional[HandEvaluation] = None
        self.show_cards: bool = False

    def reset_for_hand(self):
        self.hole_cards = []
        self.folded = False
        self.is_all_in = False
        self.current_bet = 0
        self.total_hand_bet = 0
        self.has_acted = False
        self.position_name = ""
        self.evaluation = None
        self.show_cards = False
        self.initial_hand_chips = self.chips

    def to_dict(self, hide_cards: bool = True) -> dict:
        reveal = (not hide_cards) or self.is_human or self.show_cards
        return {
            "id": self.id,
            "name": self.name,
            "chips": self.chips,
            "is_human": self.is_human,
            "personality": self.personality,
            "avatar": self.avatar,
            "folded": self.folded,
            "is_all_in": self.is_all_in,
            "current_bet": self.current_bet,
            "total_hand_bet": self.total_hand_bet,
            "has_acted": self.has_acted,
            "position": self.position_name,
            "hole_cards": [c.to_dict() for c in self.hole_cards] if reveal else [],
            "hand_evaluation": self.evaluation.to_dict() if (self.evaluation and reveal) else None,
            "show_cards": self.show_cards
        }

class ActionRecord:
    def __init__(self, player_id: str, player_name: str, action: str, amount: int, street: str, note: str = ""):
        self.player_id = player_id
        self.player_name = player_name
        self.action = action
        self.amount = amount
        self.street = street
        self.note = note

    def to_dict(self) -> dict:
        return {
            "player_id": self.player_id,
            "player_name": self.player_name,
            "action": self.action,
            "amount": self.amount,
            "street": self.street,
            "note": self.note
        }

class PokerGame:
    def __init__(
        self,
        table_size: int = 6,
        small_blind: int = 10,
        big_blind: int = 20,
        starting_stack: int = 2000,
        game_id: Optional[str] = None
    ):
        self.game_id = game_id or str(uuid.uuid4())
        self.table_size = table_size
        self.small_blind = small_blind
        self.big_blind = big_blind
        self.starting_stack = starting_stack
        
        self.players: List[Player] = []
        self.deck = Deck()
        self.community_cards: List[Card] = []
        self.pot_manager = PotManager()
        
        self.button_idx: int = 0
        self.sb_idx: int = 0
        self.bb_idx: int = 0
        self.current_player_idx: int = 0
        
        # Street: 'not_started', 'preflop', 'flop', 'turn', 'river', 'showdown', 'hand_ended'
        self.street: str = "not_started"
        self.current_high_bet: int = 0
        self.last_raise_diff: int = big_blind
        self.action_history: List[ActionRecord] = []
        self.hand_number: int = 0
        self.pots: List[Pot] = []
        self.payouts: Dict[str, int] = {}
        self.hand_summary: Dict = {}
        
        self._init_players()

    def _init_players(self):
        # Position 0 is human hero
        hero = Player("hero", "Hero (You)", self.starting_stack, is_human=True, avatar="👑")
        self.players.append(hero)

        # AI opponents
        ai_count = self.table_size - 1
        for i in range(ai_count):
            profile = DEFAULT_AI_PROFILES[i % len(DEFAULT_AI_PROFILES)]
            ai_player = Player(
                profile["id"],
                profile["name"],
                self.starting_stack,
                is_human=False,
                personality=profile["personality"],
                avatar=profile["avatar"]
            )
            self.players.append(ai_player)

    def set_table_size(self, new_size: int):
        if new_size not in (2, 6, 9):
            raise ValueError(f"Table size must be 2, 6, or 9, got {new_size}")
        if new_size == self.table_size:
            return

        self.table_size = new_size
        hero = self.players[0]
        self.players = [hero]

        ai_count = self.table_size - 1
        for i in range(ai_count):
            profile = DEFAULT_AI_PROFILES[i % len(DEFAULT_AI_PROFILES)]
            ai_player = Player(
                profile["id"],
                profile["name"],
                self.starting_stack,
                is_human=False,
                personality=profile["personality"],
                avatar=profile["avatar"]
            )
            self.players.append(ai_player)
        
        self.button_idx = 0
        self.street = "not_started"

    def start_new_hand(self):
        self.hand_number += 1
        self.deck.reset()
        self.deck.shuffle()
        self.community_cards = []
        self.pot_manager = PotManager()
        self.action_history = []
        self.pots = []
        self.payouts = {}
        self.hand_summary = {}

        # Rebought bust players
        for p in self.players:
            if p.chips <= 0:
                p.chips = self.starting_stack
            p.reset_for_hand()

        # Rotate button
        n = len(self.players)
        if self.hand_number > 1:
            self.button_idx = (self.button_idx + 1) % n

        # Assign positions
        self._assign_positions()

        # Deal 2 hole cards to each player
        for _ in range(2):
            for p in self.players:
                p.hole_cards.extend(self.deck.deal(1))

        # Post Blinds
        self._post_blinds()

        # Set street and first actor
        self.street = "preflop"
        self._set_first_actor_preflop()

    def _assign_positions(self):
        n = len(self.players)
        if n == 2:
            # Heads-up: Button is SB. Other player is BB.
            self.sb_idx = self.button_idx
            self.bb_idx = (self.button_idx + 1) % 2
            self.players[self.sb_idx].position_name = "BTN/SB"
            self.players[self.bb_idx].position_name = "BB"
        elif n == 6:
            pos_names = ["BTN", "SB", "BB", "UTG", "HJ", "CO"]
            for i in range(n):
                idx = (self.button_idx + i) % n
                self.players[idx].position_name = pos_names[i]
            self.sb_idx = (self.button_idx + 1) % n
            self.bb_idx = (self.button_idx + 2) % n
        else: # 9-max
            pos_names = ["BTN", "SB", "BB", "UTG", "UTG+1", "LJ", "HJ", "CO"]
            if n == 9:
                pos_names = ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "LJ", "HJ", "CO"]
            for i in range(n):
                idx = (self.button_idx + i) % n
                self.players[idx].position_name = pos_names[i % len(pos_names)]
            self.sb_idx = (self.button_idx + 1) % n
            self.bb_idx = (self.button_idx + 2) % n

    def _post_blinds(self):
        sb_player = self.players[self.sb_idx]
        bb_player = self.players[self.bb_idx]

        # Post SB
        sb_amt = min(sb_player.chips, self.small_blind)
        sb_player.chips -= sb_amt
        sb_player.current_bet = sb_amt
        sb_player.total_hand_bet = sb_amt
        self.pot_manager.add_contribution(sb_player.id, sb_amt)
        if sb_player.chips == 0:
            sb_player.is_all_in = True
        self.action_history.append(ActionRecord(sb_player.id, sb_player.name, "post_sb", sb_amt, "preflop"))

        # Post BB
        bb_amt = min(bb_player.chips, self.big_blind)
        bb_player.chips -= bb_amt
        bb_player.current_bet = bb_amt
        bb_player.total_hand_bet = bb_amt
        self.pot_manager.add_contribution(bb_player.id, bb_amt)
        if bb_player.chips == 0:
            bb_player.is_all_in = True
        self.action_history.append(ActionRecord(bb_player.id, bb_player.name, "post_bb", bb_amt, "preflop"))

        self.current_high_bet = max(sb_amt, bb_amt)
        self.last_raise_diff = self.big_blind

    def _set_first_actor_preflop(self):
        n = len(self.players)
        if n == 2:
            # Heads-up preflop: Button (SB) acts first
            self.current_player_idx = self.sb_idx
        else:
            # Full table preflop: UTG (left of BB) acts first
            self.current_player_idx = (self.bb_idx + 1) % n

    def _set_first_actor_postflop(self):
        n = len(self.players)
        # Postflop first actor is first non-folded, non-all-in player to the left of the button
        for i in range(1, n + 1):
            idx = (self.button_idx + i) % n
            p = self.players[idx]
            if not p.folded and not p.is_all_in:
                self.current_player_idx = idx
                return
        # If everyone remaining is all in
        self.current_player_idx = -1

    def get_active_players(self) -> List[Player]:
        return [p for p in self.players if not p.folded]

    def get_can_act_players(self) -> List[Player]:
        return [p for p in self.players if not p.folded and not p.is_all_in]

    def get_legal_actions(self, player_idx: int) -> Dict:
        if self.street in ("not_started", "hand_ended", "showdown"):
            return {"can_fold": False, "can_check": False, "can_call": False, "can_raise": False, "call_amount": 0, "min_raise": 0, "max_raise": 0}

        p = self.players[player_idx]
        call_amt = self.current_high_bet - p.current_bet
        can_check = (call_amt == 0)
        can_call = (call_amt > 0 and p.chips > 0)
        actual_call_amt = min(call_amt, p.chips)

        min_raise = self.current_high_bet + self.last_raise_diff
        max_raise = p.chips + p.current_bet
        can_raise = (max_raise >= min_raise and p.chips > actual_call_amt)

        # Quick bet calculations based on pot
        current_pot = self.pot_manager.get_total_pot()
        quick_bets = {}
        for pct in [25, 33, 50, 66, 75, 100, 150]:
            target = self.current_high_bet + int(current_pot * (pct / 100.0))
            if target >= min_raise and target <= max_raise:
                quick_bets[f"{pct}%"] = target
            elif target > max_raise and max_raise >= min_raise:
                quick_bets[f"{pct}%"] = max_raise

        return {
            "can_fold": True,
            "can_check": can_check,
            "can_call": can_call,
            "call_amount": actual_call_amt,
            "can_raise": can_raise,
            "can_all_in": p.chips > 0,
            "min_raise": min(min_raise, max_raise),
            "max_raise": max_raise,
            "pot_size": current_pot,
            "quick_bets": quick_bets
        }

    def execute_action(self, player_idx: int, action: str, amount: int = 0) -> Dict:
        if player_idx != self.current_player_idx:
            raise ValueError(f"Player {player_idx} attempted to act out of turn. Expected {self.current_player_idx}")

        p = self.players[player_idx]
        legal = self.get_legal_actions(player_idx)
        call_amt = legal["call_amount"]

        if action == "fold":
            p.folded = True
            p.has_acted = True
            self.pot_manager.player_folded(p.id)
            self.action_history.append(ActionRecord(p.id, p.name, "fold", 0, self.street))

        elif action == "check":
            if not legal["can_check"]:
                raise ValueError("Cannot check when there is a bet to call")
            p.has_acted = True
            self.action_history.append(ActionRecord(p.id, p.name, "check", 0, self.street))

        elif action == "call":
            p.chips -= call_amt
            p.current_bet += call_amt
            p.total_hand_bet += call_amt
            self.pot_manager.add_contribution(p.id, call_amt)
            if p.chips == 0:
                p.is_all_in = True
            p.has_acted = True
            self.action_history.append(ActionRecord(p.id, p.name, "call", call_amt, self.street))

        elif action in ("bet", "raise", "all_in"):
            if action == "all_in":
                target_total = p.chips + p.current_bet
            else:
                target_total = amount

            # Ensure target total respects minimum raise and stack limits
            target_total = max(target_total, legal["min_raise"])
            target_total = min(target_total, p.chips + p.current_bet)
            additional = target_total - p.current_bet
            if additional <= 0:
                if legal["can_check"]:
                    action = "check"
                    p.has_acted = True
                    self.action_history.append(ActionRecord(p.id, p.name, "check", 0, self.street))
                    self._advance_turn()
                    return self.get_state_dict()
                elif legal["can_call"]:
                    action = "call"
                    call_amt = legal["call_amount"]
                    p.chips -= call_amt
                    p.current_bet += call_amt
                    p.total_hand_bet += call_amt
                    self.pot_manager.add_contribution(p.id, call_amt)
                    if p.chips == 0:
                        p.is_all_in = True
                    p.has_acted = True
                    self.action_history.append(ActionRecord(p.id, p.name, "call", call_amt, self.street))
                    self._advance_turn()
                    return self.get_state_dict()
                else:
                    action = "fold"
                    p.folded = True
                    p.has_acted = True
                    self.pot_manager.player_folded(p.id)
                    self.action_history.append(ActionRecord(p.id, p.name, "fold", 0, self.street))
                    self._advance_turn()
                    return self.get_state_dict()

            p.chips -= additional
            p.current_bet = target_total
            p.total_hand_bet += additional
            self.pot_manager.add_contribution(p.id, additional)

            if target_total > self.current_high_bet:
                raise_diff = target_total - self.current_high_bet
                if raise_diff >= self.last_raise_diff or target_total == (p.chips + p.current_bet):
                    self.last_raise_diff = max(self.big_blind, raise_diff)
                self.current_high_bet = target_total
                # Reopen action for other players who haven't folded or are all-in
                for other in self.players:
                    if other.id != p.id and not other.folded and not other.is_all_in:
                        other.has_acted = False

            if p.chips == 0:
                p.is_all_in = True
            p.has_acted = True
            act_label = "all_in" if p.is_all_in else ("raise" if legal["can_call"] else "bet")
            self.action_history.append(ActionRecord(p.id, p.name, act_label, additional, self.street))

        else:
            raise ValueError(f"Unknown action: {action}")

        # Check if hand ends immediately due to folds
        active_non_folded = self.get_active_players()
        if len(active_non_folded) == 1:
            self._end_hand_single_winner(active_non_folded[0])
            return self.get_state_dict()

        # Advance to next player or next street
        self._advance_turn()
        return self.get_state_dict()

    def _advance_turn(self):
        # Check if betting round complete
        if self._is_betting_round_complete():
            self._advance_street()
            return

        # Advance to next can-act player
        n = len(self.players)
        for i in range(1, n + 1):
            next_idx = (self.current_player_idx + i) % n
            candidate = self.players[next_idx]
            if not candidate.folded and not candidate.is_all_in and not candidate.has_acted:
                self.current_player_idx = next_idx
                return

        # If all who can act have acted, round complete
        self._advance_street()

    def _is_betting_round_complete(self) -> bool:
        can_act = self.get_can_act_players()
        if not can_act:
            return True
        for p in can_act:
            if not p.has_acted or p.current_bet != self.current_high_bet:
                return False
        return True

    def _advance_street(self):
        # Reset current bets for all players
        for p in self.players:
            p.current_bet = 0
            p.has_acted = False

        self.current_high_bet = 0
        self.last_raise_diff = self.big_blind

        can_act = self.get_can_act_players()
        active = self.get_active_players()

        # If 0 or 1 player can act and 2+ active, run out remaining board to showdown
        if len(can_act) <= 1 and len(active) >= 2:
            self._deal_runout_to_showdown()
            return

        if self.street == "preflop":
            self.street = "flop"
            self.deck.deal(1) # Burn card
            self.community_cards.extend(self.deck.deal(3))
            self._set_first_actor_postflop()

        elif self.street == "flop":
            self.street = "turn"
            self.deck.deal(1) # Burn
            self.community_cards.extend(self.deck.deal(1))
            self._set_first_actor_postflop()

        elif self.street == "turn":
            self.street = "river"
            self.deck.deal(1) # Burn
            self.community_cards.extend(self.deck.deal(1))
            self._set_first_actor_postflop()

        elif self.street == "river":
            self._resolve_showdown()

    def _deal_runout_to_showdown(self):
        """Deal all remaining streets when players are all-in, then showdown."""
        needed_cards = 5 - len(self.community_cards)
        if needed_cards > 0:
            for _ in range(needed_cards):
                self.deck.deal(1) # Burn
                self.community_cards.extend(self.deck.deal(1))
        self._resolve_showdown()

    def _end_hand_single_winner(self, winner: Player):
        self.street = "hand_ended"
        # Refund uncalled bets first
        refunds = self.pot_manager.refund_uncalled_bets()
        for pid, ref in refunds.items():
            for p in self.players:
                if p.id == pid:
                    p.chips += ref

        total_pot = self.pot_manager.get_total_pot()
        winner.chips += total_pot
        self.payouts = {winner.id: total_pot}
        self.pots = [Pot(total_pot, {winner.id})]
        self.pots[0].winners = [winner.id]
        self.pots[0].payouts[winner.id] = total_pot

        self.hand_summary = {
            "hand_number": self.hand_number,
            "single_winner": True,
            "winner_id": winner.id,
            "winner_name": winner.name,
            "amount_won": total_pot,
            "description": f"{winner.name} wins {total_pot} chips (everyone folded)"
        }

    def _resolve_showdown(self):
        self.street = "showdown"
        # Refund uncalled bet
        refunds = self.pot_manager.refund_uncalled_bets()
        for pid, ref in refunds.items():
            for p in self.players:
                if p.id == pid:
                    p.chips += ref

        active = self.get_active_players()
        evaluations: Dict[str, HandEvaluation] = {}
        for p in active:
            p.show_cards = True
            eval_res = evaluate_hand(p.hole_cards + self.community_cards)
            p.evaluation = eval_res
            evaluations[p.id] = eval_res

        # Position order starting left of button
        n = len(self.players)
        pos_order = [self.players[(self.button_idx + 1 + i) % n].id for i in range(n)]

        self.pots, self.payouts = self.pot_manager.resolve_showdown(evaluations, pos_order)

        for pid, payout in self.payouts.items():
            for p in self.players:
                if p.id == pid:
                    p.chips += payout

        winners_info = []
        for pot in self.pots:
            for wid in pot.winners:
                w_player = next(p for p in self.players if p.id == wid)
                winners_info.append(f"{w_player.name} with {w_player.evaluation.description}")

        self.hand_summary = {
            "hand_number": self.hand_number,
            "single_winner": False,
            "payouts": self.payouts,
            "board": [c.to_dict() for c in self.community_cards],
            "descriptions": winners_info
        }

    def play_ai_turns(self) -> List[Dict]:
        """
        Executes AI turns sequentially until it's the human hero's turn
        or the hand reaches showdown / hand_ended.
        Returns list of executed actions.
        """
        logs = []
        while self.street not in ("not_started", "hand_ended", "showdown"):
            curr = self.players[self.current_player_idx]
            if curr.is_human:
                break
            if curr.folded or curr.is_all_in:
                self._advance_turn()
                continue

            # It's an AI player's turn
            legal = self.get_legal_actions(self.current_player_idx)
            ai_actor = OpponentAI(curr.id, curr.name, curr.personality, curr.avatar)
            
            action, amount, reason = ai_actor.decide_action(
                hole_cards=curr.hole_cards,
                board=self.community_cards,
                current_pot=self.pot_manager.get_total_pot(),
                call_amount=legal["call_amount"],
                min_raise=legal["min_raise"],
                player_stack=curr.chips,
                position_name=curr.position_name,
                active_players_count=len(self.get_active_players()),
                street=self.street
            )

            # Sanitize chosen action against legal moves
            if action == "raise" and not legal["can_raise"]:
                action = "call" if legal["can_call"] else "check"
            elif action == "check" and not legal["can_check"]:
                action = "call" if legal["can_call"] else "fold"
            elif action == "call" and not legal["can_call"]:
                action = "check" if legal["can_check"] else "fold"

            # Execute
            self.execute_action(self.current_player_idx, action, amount)
            logs.append({"player": curr.name, "action": action, "amount": amount, "reason": reason})

        return logs

    def get_state_dict(self) -> dict:
        is_terminal = self.street in ("hand_ended", "showdown")
        return {
            "game_id": self.game_id,
            "hand_number": self.hand_number,
            "table_size": self.table_size,
            "small_blind": self.small_blind,
            "big_blind": self.big_blind,
            "street": self.street,
            "button_idx": self.button_idx,
            "current_player_idx": self.current_player_idx,
            "current_high_bet": self.current_high_bet,
            "pot_total": self.pot_manager.get_total_pot(),
            "pots": [p.to_dict() for p in self.pots],
            "community_cards": [c.to_dict() for c in self.community_cards],
            "players": [p.to_dict(hide_cards=not is_terminal) for p in self.players],
            "legal_actions": self.get_legal_actions(self.current_player_idx) if not is_terminal and self.current_player_idx >= 0 else None,
            "action_history": [a.to_dict() for a in self.action_history],
            "hand_summary": self.hand_summary,
            "payouts": self.payouts
        }

