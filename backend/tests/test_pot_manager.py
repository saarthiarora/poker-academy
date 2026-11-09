import unittest
from app.engine.pot_manager import PotManager
from app.engine.card import parse_cards
from app.engine.hand_evaluator import evaluate_hand

class TestPotManager(unittest.TestCase):
    def test_single_pot_single_winner(self):
        pm = PotManager()
        pm.add_contribution("p1", 50)
        pm.add_contribution("p2", 50)
        self.assertEqual(pm.get_total_pot(), 100)

        evals = {
            "p1": evaluate_hand(parse_cards("As Ks 2c 3c 4c 7d 8h")), # High card A, K
            "p2": evaluate_hand(parse_cards("Qs Qd 2c 3c 4c 7d 8h"))  # Pair of Queens
        }
        pots, payouts = pm.resolve_showdown(evals, ["p1", "p2"])
        self.assertEqual(len(pots), 1)
        self.assertEqual(payouts["p2"], 100)
        self.assertEqual(payouts["p1"], 0)

    def test_split_pot_with_odd_chip(self):
        pm = PotManager()
        pm.add_contribution("p1", 25)
        pm.add_contribution("p2", 25)
        # Total pot 50 -> wait, let's make it 51 with dead blinds
        pm.add_contribution("p3", 1) # p3 folds
        pm.player_folded("p3")
        self.assertEqual(pm.get_total_pot(), 51)

        evals = {
            "p1": evaluate_hand(parse_cards("Ah Kh Qs Js 9c 3d 2c")),
            "p2": evaluate_hand(parse_cards("Ad Kd Qc Jc 9d 3h 2s"))
        }
        pots, payouts = pm.resolve_showdown(evals, ["p1", "p2"])
        self.assertEqual(payouts["p1"] + payouts["p2"], 51)
        # 51 // 2 = 25 each, 1 remainder goes to first in position order ("p1")
        self.assertEqual(payouts["p1"], 26)
        self.assertEqual(payouts["p2"], 25)

    def test_uncalled_bet_refund(self):
        pm = PotManager()
        pm.add_contribution("p1", 100) # Bet 100
        pm.add_contribution("p2", 40)  # All-in for 40
        refunds = pm.refund_uncalled_bets()
        self.assertEqual(refunds.get("p1"), 60)
        self.assertEqual(pm.contributions["p1"], 40)
        self.assertEqual(pm.get_total_pot(), 80)

    def test_side_pot_multi_level(self):
        # A folds after 10
        # B all in for 50
        # C all in for 100
        # D calls 100
        pm = PotManager()
        pm.add_contribution("A", 10)
        pm.player_folded("A")
        pm.add_contribution("B", 50)
        pm.add_contribution("C", 100)
        pm.add_contribution("D", 100)

        # Total 260
        # Main pot: 10 (A) + 50 (B) + 50 (C) + 50 (D) = 160. Eligible: B, C, D
        # Side pot: 50 (C) + 50 (D) = 100. Eligible: C, D
        pots = pm.calculate_pots()
        self.assertEqual(len(pots), 2)
        self.assertEqual(pots[0].amount, 160)
        self.assertEqual(pots[0].eligible_player_ids, {"B", "C", "D"})
        self.assertEqual(pots[1].amount, 100)
        self.assertEqual(pots[1].eligible_player_ids, {"C", "D"})

        # Suppose B has the best hand (Full House)
        # C has Two Pair
        # D has Pair
        evals = {
            "B": evaluate_hand(parse_cards("As Ah Ad Ks Kh 2c 3c")), # AAA KK
            "C": evaluate_hand(parse_cards("Qs Qh Js Jh 2c 3c 4c")), # QQ JJ
            "D": evaluate_hand(parse_cards("Ts Th 9s 8h 2c 3c 4c"))  # TT
        }
        pots_res, payouts = pm.resolve_showdown(evals, ["B", "C", "D"])
        # B wins main pot (160)
        # C wins side pot (100)
        self.assertEqual(payouts["B"], 160)
        self.assertEqual(payouts["C"], 100)
        self.assertEqual(payouts["D"], 0)

if __name__ == "__main__":
    unittest.main()

