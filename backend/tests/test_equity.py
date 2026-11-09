import unittest
from app.engine.equity_calculator import run_equity_simulation

class TestEquityCalculator(unittest.TestCase):
    def test_aa_vs_kk_preflop(self):
        # AA vs KK is one of poker's classic matchups (~81% vs 18%)
        players = [
            {"id": "hero", "label": "Hero AA", "cards": ["As", "Ah"]},
            {"id": "villain", "label": "Villain KK", "cards": ["Kd", "Kc"]}
        ]
        res = run_equity_simulation(players, board_cards=[], num_simulations=3000, seed=42)
        hero_res = res["results"][0]
        villain_res = res["results"][1]
        
        # AA equity should be between 78% and 85%
        self.assertGreater(hero_res["equity_pct"], 78.0)
        self.assertLess(hero_res["equity_pct"], 85.0)
        self.assertGreater(villain_res["equity_pct"], 15.0)

    def test_postflop_nut_flush_draw_vs_overpair(self):
        # Hero: As Ks
        # Villain: Qh Qd
        # Board: 8s 7c 2s
        players = [
            {"id": "hero", "label": "Hero", "cards": ["As", "Ks"]},
            {"id": "villain", "label": "Villain", "cards": ["Qh", "Qd"]}
        ]
        board = ["8s", "7c", "2s"]
        res = run_equity_simulation(players, board_cards=board, num_simulations=3000, seed=42)
        hero_res = res["results"][0]
        villain_res = res["results"][1]
        
        # As Ks has 9 spade outs + 3 Aces + 3 Kings = 15 outs twice (~54% equity)
        self.assertGreater(hero_res["equity_pct"], 45.0)
        self.assertLess(hero_res["equity_pct"], 60.0)

    def test_duplicate_cards_rejected(self):
        players = [
            {"id": "p1", "cards": ["As", "Kd"]},
            {"id": "p2", "cards": ["As", "Qc"]}
        ]
        with self.assertRaises(ValueError):
            run_equity_simulation(players, board_cards=[], num_simulations=100)

if __name__ == "__main__":
    unittest.main()

