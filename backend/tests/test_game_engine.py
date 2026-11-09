import unittest
from app.engine.game_state import PokerGame

class TestGameEngine(unittest.TestCase):
    def test_heads_up_initialization_and_action_order(self):
        game = PokerGame(table_size=2, small_blind=10, big_blind=20, starting_stack=1000)
        self.assertEqual(len(game.players), 2)
        game.start_new_hand()
        self.assertEqual(game.street, "preflop")
        # In heads-up, button is SB
        self.assertEqual(game.sb_idx, game.button_idx)
        self.assertEqual(game.players[game.sb_idx].position_name, "BTN/SB")
        self.assertEqual(game.players[game.bb_idx].position_name, "BB")
        # SB acts first preflop in heads-up
        self.assertEqual(game.current_player_idx, game.sb_idx)
        # Blinds posted: SB 10, BB 20
        self.assertEqual(game.players[game.sb_idx].current_bet, 10)
        self.assertEqual(game.players[game.bb_idx].current_bet, 20)
        self.assertEqual(game.current_high_bet, 20)

    def test_6max_positions_and_utg_first(self):
        game = PokerGame(table_size=6, small_blind=10, big_blind=20, starting_stack=1000)
        game.start_new_hand()
        # In 6-max, button is 0, SB is 1, BB is 2, UTG is 3
        self.assertEqual(game.button_idx, 0)
        self.assertEqual(game.sb_idx, 1)
        self.assertEqual(game.bb_idx, 2)
        self.assertEqual(game.players[3].position_name, "UTG")
        self.assertEqual(game.current_player_idx, 3)

    def test_chip_conservation_throughout_hand(self):
        game = PokerGame(table_size=2, small_blind=10, big_blind=20, starting_stack=1000)
        total_initial_chips = sum(p.chips for p in game.players)
        game.start_new_hand()
        # SB calls 10 more to match BB 20
        game.execute_action(game.sb_idx, "call")
        # BB checks
        game.execute_action(game.bb_idx, "check")
        # Street should advance to flop!
        self.assertEqual(game.street, "flop")
        self.assertEqual(len(game.community_cards), 3)

        # Flop: BB acts first postflop in heads-up
        self.assertEqual(game.current_player_idx, game.bb_idx)
        game.execute_action(game.bb_idx, "check")
        game.execute_action(game.sb_idx, "check")
        self.assertEqual(game.street, "turn")
        self.assertEqual(len(game.community_cards), 4)

        # Turn checks
        game.execute_action(game.bb_idx, "check")
        game.execute_action(game.sb_idx, "check")
        self.assertEqual(game.street, "river")
        self.assertEqual(len(game.community_cards), 5)

        # River checks -> showdown
        game.execute_action(game.bb_idx, "check")
        game.execute_action(game.sb_idx, "check")
        self.assertEqual(game.street, "showdown")

        # Crucial invariant: total chips in play must NEVER change!
        total_final_chips = sum(p.chips for p in game.players)
        self.assertEqual(total_initial_chips, total_final_chips)

    def test_fold_ends_hand_and_awards_pot(self):
        game = PokerGame(table_size=2, small_blind=10, big_blind=20, starting_stack=1000)
        game.start_new_hand()
        # SB folds
        game.execute_action(game.sb_idx, "fold")
        self.assertEqual(game.street, "hand_ended")
        # BB should receive the pot (10 from SB + 20 from BB = 30)
        self.assertEqual(game.players[game.bb_idx].chips, 1010)
        self.assertEqual(game.players[game.sb_idx].chips, 990)

if __name__ == "__main__":
    unittest.main()

