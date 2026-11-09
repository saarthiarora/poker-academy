import unittest
from app.engine.card import Card, parse_cards
from app.engine.hand_evaluator import evaluate_hand, evaluate_5_cards

class TestHandEvaluator(unittest.TestCase):
    def test_royal_flush(self):
        cards = parse_cards("As Ks Qs Js Ts")
        res = evaluate_hand(cards)
        self.assertEqual(res.category, 8)
        self.assertEqual(res.score, (8, 14))
        self.assertIn("Royal Flush", res.description)

    def test_straight_flush_and_wheel_sf(self):
        sf9 = parse_cards("9h 8h 7h 6h 5h")
        wheel_sf = parse_cards("Ah 2h 3h 4h 5h")
        res9 = evaluate_hand(sf9)
        res_wheel = evaluate_hand(wheel_sf)
        self.assertEqual(res9.category, 8)
        self.assertEqual(res9.score, (8, 9))
        self.assertEqual(res_wheel.category, 8)
        self.assertEqual(res_wheel.score, (8, 5))
        self.assertGreater(res9, res_wheel)

    def test_four_of_a_kind_kicker(self):
        quads_a = parse_cards("Kh Ks Kd Kc Ah")
        quads_q = parse_cards("Kh Ks Kd Kc Qh")
        res_a = evaluate_hand(quads_a)
        res_q = evaluate_hand(quads_q)
        self.assertEqual(res_a.category, 7)
        self.assertGreater(res_a, res_q)

    def test_full_house(self):
        fh1 = parse_cards("As Ah Ad Ks Kh") # Aces full of Kings
        fh2 = parse_cards("Ks Kh Kd As Ah") # Kings full of Aces
        res1 = evaluate_hand(fh1)
        res2 = evaluate_hand(fh2)
        self.assertEqual(res1.category, 6)
        self.assertGreater(res1, res2)

    def test_flush_kicker_order(self):
        flush1 = parse_cards("As Js 8s 6s 2s")
        flush2 = parse_cards("As Js 8s 5s 4s")
        res1 = evaluate_hand(flush1)
        res2 = evaluate_hand(flush2)
        self.assertEqual(res1.category, 5)
        self.assertGreater(res1, res2)

    def test_straight_and_wheel(self):
        wheel = parse_cards("5d 4c 3s 2h As")
        six_high = parse_cards("6d 5c 4s 3h 2s")
        res_wheel = evaluate_hand(wheel)
        res_six = evaluate_hand(six_high)
        self.assertEqual(res_wheel.category, 4)
        self.assertEqual(res_wheel.score, (4, 5))
        self.assertEqual(res_six.score, (4, 6))
        self.assertGreater(res_six, res_wheel)

    def test_three_of_a_kind(self):
        trips1 = parse_cards("7s 7d 7h As Kd")
        trips2 = parse_cards("7s 7d 7h As Qd")
        res1 = evaluate_hand(trips1)
        res2 = evaluate_hand(trips2)
        self.assertEqual(res1.category, 3)
        self.assertGreater(res1, res2)

    def test_two_pair(self):
        tp1 = parse_cards("As Ad Ks Kd Jh")
        tp2 = parse_cards("As Ad Qs Qd Th")
        tp3 = parse_cards("As Ad Ks Kd Th")
        res1 = evaluate_hand(tp1)
        res2 = evaluate_hand(tp2)
        res3 = evaluate_hand(tp3)
        self.assertEqual(res1.category, 2)
        self.assertGreater(res1, res2)
        self.assertGreater(res1, res3)

    def test_one_pair(self):
        p1 = parse_cards("Ts Td As Kd Qd")
        p2 = parse_cards("Ts Td As Kd Jd")
        res1 = evaluate_hand(p1)
        res2 = evaluate_hand(p2)
        self.assertEqual(res1.category, 1)
        self.assertGreater(res1, res2)

    def test_high_card(self):
        hc1 = parse_cards("Ah Kd Qs Js 9c")
        hc2 = parse_cards("Ah Kd Qs Js 8c")
        res1 = evaluate_hand(hc1)
        res2 = evaluate_hand(hc2)
        self.assertEqual(res1.category, 0)
        self.assertGreater(res1, res2)

    def test_split_pot_tie(self):
        hand1 = parse_cards("Ah Kh Qs Js 9c")
        hand2 = parse_cards("Ad Kd Qc Jc 9d")
        res1 = evaluate_hand(hand1)
        res2 = evaluate_hand(hand2)
        self.assertEqual(res1, res2)

    def test_seven_card_eval(self):
        # 7 cards with hidden Full House and Flush:
        # Board: As Ks 2s 7d Jh
        # Hole: Ah Ad
        # Makes Aces full of Kings (or trips/two pair)
        cards = parse_cards("Ah Ad As Ks 2s 7d Jh")
        res = evaluate_hand(cards)
        self.assertEqual(res.category, 3) # Three Aces + K + J kicker
        
        # Now with 2 Kings on board:
        cards2 = parse_cards("Ah Ad As Ks Kd 7d Jh")
        res2 = evaluate_hand(cards2)
        self.assertEqual(res2.category, 6) # Full house AAA KK
        self.assertEqual(res2.score, (6, 14, 13))

if __name__ == "__main__":
    unittest.main()

