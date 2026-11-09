import unittest
from app.routers import game, coach, ranges, equity, simulations, analysis, stats
from app.models.schemas import (
    NewGameRequest,
    PlayerActionRequest,
    CoachQuestionRequest,
    EquitySimulationRequest,
    HandAnalysisRequest,
    HandVsRangeRequest,
    QuizAnswerRequest
)

class TestRouterIntegration(unittest.TestCase):
    def test_new_game_and_actions(self):
        # 2-player heads up
        state = game.start_new_game(NewGameRequest(table_size=2, starting_stack=2000))
        self.assertEqual(state["table_size"], 2)
        self.assertEqual(len(state["players"]), 2)
        self.assertEqual(state["street"], "preflop")

        # Execute action
        if state["current_player_idx"] == 0 and state["legal_actions"]:
            act = "call" if state["legal_actions"]["can_call"] else "check"
            res = game.execute_player_action(PlayerActionRequest(action=act, amount=0, coaching_mode=True))
            self.assertIn("coaching_feedback", res)
            self.assertIn("street", res)

    def test_ranges_matrix(self):
        res = ranges.get_range_matrix("6max", "BTN", "rfi", "100bb")
        self.assertEqual(len(res["matrix"]), 13)
        self.assertEqual(len(res["matrix"][0]), 13)
        self.assertGreater(res["estimated_range_pct"], 40.0)

    def test_coach_ask(self):
        res = coach.ask_coach(CoachQuestionRequest(question="How do I calculate pot odds?"))
        self.assertIn("Pot Odds", res["title"])
        self.assertEqual(res["type"], "mathematical_fact")

    def test_equity_calculation(self):
        payload = EquitySimulationRequest(
            players=[
                {"id": "hero", "cards": ["As", "Ks"]},
                {"id": "villain", "cards": ["Qh", "Qd"]}
            ],
            board=["8s", "7c", "2s"],
            num_simulations=500
        )
        res = equity.calculate_equity(payload)
        self.assertEqual(len(res["results"]), 2)
        self.assertGreater(res["results"][0]["equity_pct"], 40.0)

    def test_hand_analysis(self):
        payload = HandAnalysisRequest(
            hero_cards=["Ah", "Kd"],
            board_cards=["Ac", "7d", "2s"],
            position="BTN",
            pot_size=100,
            call_amount=50
        )
        res = analysis.evaluate_custom_hand(payload)
        self.assertIn("equity_pct", res)
        self.assertIn("recommended_action", res)

    def test_simulations(self):
        payload = HandVsRangeRequest(
            hero_cards=["As", "Kh"],
            range_target="top_5",
            board=[],
            simulations=500
        )
        res = simulations.hand_vs_range(payload)
        self.assertIn("hero", res)
        self.assertIn("villain", res)

        quiz = simulations.get_quiz()
        self.assertIn("scenario", quiz)

    def test_stats_overview(self):
        res = stats.get_stats_overview()
        self.assertIn("vpip_pct", res)
        self.assertIn("decision_accuracy_pct", res)

if __name__ == "__main__":
    unittest.main()
