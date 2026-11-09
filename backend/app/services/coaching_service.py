from typing import Dict, List, Optional, Any
from app.engine.card import Card, parse_cards
from app.engine.hand_evaluator import evaluate_hand, HandEvaluation
from app.services.range_service import get_hand_action

CHESSCOM_GRADES = {
    "BRILLIANT": {
        "score": 100,
        "label": "Brilliant Move",
        "color": "cyan",
        "badge": "💎 Brilliant",
        "sound": "brilliant"
    },
    "BEST": {
        "score": 95,
        "label": "Best Move",
        "color": "emerald",
        "badge": "🟢 Best Move",
        "sound": "good"
    },
    "EXCELLENT": {
        "score": 85,
        "label": "Excellent",
        "color": "blue",
        "badge": "🔵 Excellent",
        "sound": "good"
    },
    "GOOD": {
        "score": 75,
        "label": "Good",
        "color": "teal",
        "badge": "👍 Good",
        "sound": "good"
    },
    "INACCURACY": {
        "score": 55,
        "label": "Inaccuracy",
        "color": "amber",
        "badge": "🟡 Inaccuracy",
        "sound": "warning"
    },
    "MISTAKE": {
        "score": 35,
        "label": "Mistake",
        "color": "orange",
        "badge": "🔴 Mistake",
        "sound": "blunder"
    },
    "BLUNDER": {
        "score": 10,
        "label": "Blunder",
        "color": "red",
        "badge": "❌ Blunder",
        "sound": "blunder"
    }
}

def analyze_user_decision(
    hole_cards: List[Card],
    board: List[Card],
    street: str,
    position: str,
    pot_size: int,
    call_amount: int,
    action_taken: str,
    action_amount: int,
    stack_size: int,
    table_size: int = 6
) -> Dict[str, Any]:
    """
    Evaluates a user's decision objectively with Chess.com style classification.
    """
    # 1. Hand notation
    if len(hole_cards) == 2:
        c1, c2 = hole_cards[0], hole_cards[1]
        hi, lo = (c1, c2) if c1.rank >= c2.rank else (c2, c1)
        suit_marker = "s" if hi.suit == lo.suit else ("" if hi.rank == lo.rank else "o")
        hand_notation = f"{hi.display_rank}{lo.display_rank}{suit_marker}"
    else:
        hand_notation = "??"

    # 2. Hand evaluation & made strength
    if board:
        made_eval = evaluate_hand(hole_cards + board)
        hand_rank_desc = made_eval.description
        hand_category = made_eval.category_name
    else:
        made_eval = None
        hand_rank_desc = f"Starting hand {hand_notation}"
        hand_category = "Preflop Hole Cards"

    # 3. Pot odds calculation
    if call_amount > 0:
        pot_odds_pct = round((call_amount / (pot_size + call_amount)) * 100, 1)
        pot_odds_ratio = f"{round(pot_size / call_amount, 1)} : 1"
    else:
        pot_odds_pct = 0.0
        pot_odds_ratio = "Free check"

    # 4. Determine Chess.com style classification & feedback
    grade = "BEST"
    recommended_action = "check"
    feedback_reason = ""
    alternative_action = ""
    strategic_lesson = ""

    # PREFLOP EVALUATION
    if street == "preflop":
        sit = "facing_open" if call_amount > 0 else "rfi"
        chart_info = get_hand_action(hand_notation, "6max", position, sit, "100bb")
        recommended_action = chart_info["action"]

        if action_taken.lower() == recommended_action.lower():
            if recommended_action in ("raise", "3bet") and hand_notation in ("A5s", "A4s", "T9s", "87s", "65s"):
                grade = "BRILLIANT"
                feedback_reason = f"💎 Brilliant semi-bluff open/3-bet with {hand_notation}! Excellent board coverage, blocker value, and fold equity."
            else:
                grade = "BEST"
                feedback_reason = f"🟢 Best move! {chart_info['reasoning']}"
        elif recommended_action == "mixed":
            grade = "EXCELLENT"
            feedback_reason = f"🔵 Excellent decision. {hand_notation} from {position} is a solver-approved mixed frequency hand."
        elif recommended_action in ("raise", "3bet") and action_taken == "call":
            grade = "INACCURACY"
            feedback_reason = f"🟡 Inaccuracy. Flat calling with {hand_notation} from {position} gives up preflop initiative and invites multiway pots."
            alternative_action = "Raise to 2.5x BB to isolate opponents and take down dead blind money."
        elif recommended_action in ("raise", "3bet") and action_taken == "fold":
            grade = "BLUNDER"
            feedback_reason = f"❌ Blunder! Folding {hand_notation} from {position} throws away massive positive expected value (+EV)."
            alternative_action = "Open raise or 3-bet aggressively with premium holdings."
        elif recommended_action == "fold" and action_taken in ("raise", "bet"):
            grade = "MISTAKE"
            feedback_reason = f"🔴 Mistake. Opening weak holding {hand_notation} from {position} is -EV and gets exploited by aggressive players behind."
            alternative_action = "Disciplined fold preflop."
        elif recommended_action == "fold" and action_taken == "call":
            grade = "BLUNDER"
            feedback_reason = f"❌ Blunder! Loose-passive limp/call with dominated holding {hand_notation} bleeds chips over time."
            alternative_action = "Fold preflop and wait for profitable spots."
        else:
            grade = "GOOD"
            feedback_reason = f"👍 Solid standard play with {hand_notation}."

        strategic_lesson = f"Preflop discipline drives 80% of poker win rate. Position gives you the final word on Flop, Turn, and River."

    # POSTFLOP EVALUATION
    else:
        cat = made_eval.category if made_eval else 0
        can_check = (call_amount == 0)

        # Check for drawing potential (flush draw or straight draw)
        combined = hole_cards + board
        suits = [c.suit for c in combined]
        suit_counts = {s: suits.count(s) for s in set(suits)}
        has_flush_draw = any(cnt == 4 for cnt in suit_counts.values()) and len(board) < 5
        has_flush_draw_with_hole = has_flush_draw and any(c.suit in [s for s, cnt in suit_counts.items() if cnt == 4] for c in hole_cards)

        # Monster Hands: Full House, Quads, Straight Flush, Nut Flush, Straight (cat >= 4)
        if cat >= 4:
            recommended_action = "bet" if can_check else "raise"
            if action_taken in ("bet", "raise", "all_in"):
                if action_amount >= pot_size * 0.60:
                    grade = "BRILLIANT"
                    feedback_reason = f"💎 Brilliant value sizing! You hold {hand_rank_desc} and are maximizing value against their calling range."
                else:
                    grade = "BEST"
                    feedback_reason = f"🟢 Best move! Building the pot with {hand_rank_desc} is mandatory."
            elif action_taken in ("check", "call"):
                grade = "EXCELLENT"
                feedback_reason = f"🔵 Excellent trap! Checking/calling with {hand_rank_desc} can induce aggressive bluffs from opponents."
                alternative_action = "Bet 66% to 75% pot on wet boards to charge draws."
            else:
                grade = "BLUNDER"
                feedback_reason = f"❌ Blunder! Folding monster hand {hand_rank_desc} is catastrophic."

            strategic_lesson = "When you flop a monster, extracting maximum chips over 3 streets is where high-stakes win rates are born."

        # Strong Hands: Two Pair, Trips/Set, Overpair, Top Pair Top Kicker
        elif cat in (2, 3) or (cat == 1 and made_eval.score[1] >= 12):
            recommended_action = "bet" if can_check else "call"
            if can_check and action_taken in ("bet", "raise"):
                grade = "BEST"
                feedback_reason = f"🟢 Best move! Value betting {hand_rank_desc} protects your equity and charges second-best hands."
            elif can_check and action_taken == "check":
                grade = "EXCELLENT"
                feedback_reason = f"🔵 Excellent pot control. Checking {hand_rank_desc} keeps their range wide and under-represented."
            elif not can_check and action_taken == "call":
                grade = "BEST"
                feedback_reason = f"🟢 Best move! Your {hand_rank_desc} easily clears the {pot_odds_pct}% pot odds requirement."
            elif not can_check and action_taken in ("raise", "all_in"):
                grade = "GOOD"
                feedback_reason = f"👍 Aggressive raise with {hand_rank_desc}. Watch out for isolating yourself against only better hands."
            else:
                grade = "BLUNDER"
                feedback_reason = f"❌ Blunder! Folding {hand_rank_desc} facing an ordinary bet surrenders substantial equity."

            strategic_lesson = "Top pair and two pair are showdown value hands: bet them for value against worse, call against bets."

        # Medium / Drawing Hands: Flush Draw, Open-Ended Straight Draw, Second Pair
        elif has_flush_draw_with_hole or cat == 1:
            if has_flush_draw_with_hole and action_taken in ("bet", "raise"):
                grade = "BRILLIANT"
                feedback_reason = f"💎 Brilliant semi-bluff! Betting your flush draw combines fold equity with 9 outs to the nuts."
                recommended_action = "bet"
            elif can_check and action_taken == "check":
                grade = "BEST"
                feedback_reason = f"🟢 Best move. Checking {hand_rank_desc} takes a free card with drawing equity."
                recommended_action = "check"
            elif not can_check and action_taken == "call":
                if pot_odds_pct <= 30 or has_flush_draw_with_hole:
                    grade = "BEST"
                    feedback_reason = f"🟢 Best move! Calling with strong draw/pair gives you excellent implied odds to hit your hand."
                    recommended_action = "call"
                else:
                    grade = "INACCURACY"
                    feedback_reason = f"🟡 Inaccuracy. Calling on pot odds of {pot_odds_pct}% is slightly loose unless villain pays off big."
                    recommended_action = "fold"
            elif not can_check and action_taken == "fold":
                if pot_odds_pct > 32 and not has_flush_draw_with_hole:
                    grade = "GOOD"
                    feedback_reason = f"👍 Disciplined fold. The price was too high for a weak pair."
                    recommended_action = "fold"
                else:
                    grade = "MISTAKE"
                    feedback_reason = f"🔴 Mistake. Folding a strong draw/pair getting favorable pot odds throws away equity."
                    recommended_action = "call"
            else:
                grade = "GOOD"
                feedback_reason = f"👍 Solid, balanced play."

            strategic_lesson = "Semi-bluffing draws gives you two ways to win: opponent folds now, or you hit the nuts on the next card."

        # Weak Hands / Unimproved High Card
        else:
            recommended_action = "check" if can_check else "fold"
            if can_check and action_taken == "check":
                grade = "BEST"
                feedback_reason = "🟢 Best move. Checking air with zero showdown value."
            elif can_check and action_taken in ("bet", "raise"):
                grade = "GOOD"
                feedback_reason = "👍 Aggressive bluff attempt attacking checked weakness."
            elif not can_check and action_taken == "fold":
                grade = "BEST"
                feedback_reason = "🟢 Best move! Easy fold with no made hand and no draws."
            elif not can_check and action_taken == "call":
                grade = "BLUNDER"
                feedback_reason = "❌ Blunder! Calling a bet with unimproved high card and no draw is a severe leak."
            else:
                grade = "GOOD"
                feedback_reason = "👍 Playable bluff line."

            strategic_lesson = "Never call bets with nothing ('air'). If you have zero showdown value, either fold or turn it into a deliberate blocker bluff."

    grade_meta = CHESSCOM_GRADES.get(grade, CHESSCOM_GRADES["GOOD"])

    return {
        "hand_notation": hand_notation,
        "street": street,
        "position": position,
        "hand_category": hand_category,
        "hand_rank_desc": hand_rank_desc,
        "action_taken": action_taken,
        "action_amount": action_amount,
        "pot_size": pot_size,
        "call_amount": call_amount,
        "pot_odds_pct": pot_odds_pct,
        "pot_odds_ratio": pot_odds_ratio,
        "recommended_action": recommended_action,
        "grade": grade,
        "grade_label": grade_meta["label"],
        "grade_color": grade_meta["color"],
        "grade_badge": grade_meta["badge"],
        "grade_score": grade_meta["score"],
        "grade_sound": grade_meta["sound"],
        "feedback_reason": feedback_reason,
        "alternative_action": alternative_action,
        "strategic_lesson": strategic_lesson
    }

def generate_post_hand_review(
    hero_hole_cards: List[Card],
    board: List[Card],
    decisions: List[Dict],
    payouts: Dict[str, int],
    hand_summary: Dict
) -> Dict[str, Any]:
    hero_payout = payouts.get("hero", 0)
    won_hand = hero_payout > 0

    if not decisions:
        overall_grade = "GOOD"
        avg_score = 85
        major_mistakes = []
    else:
        scores = [d.get("grade_score", 75) for d in decisions]
        avg_score = int(sum(scores) / len(scores))
        if avg_score >= 95:
            overall_grade = "BRILLIANT"
        elif avg_score >= 88:
            overall_grade = "BEST"
        elif avg_score >= 75:
            overall_grade = "GOOD"
        elif avg_score >= 50:
            overall_grade = "INACCURACY"
        else:
            overall_grade = "BLUNDER"

        major_mistakes = [d for d in decisions if d.get("grade") in ("BLUNDER", "MISTAKE", "INACCURACY")]

    final_eval = evaluate_hand(hero_hole_cards + board) if (hero_hole_cards and board and len(hero_hole_cards + board) >= 5) else None

    if major_mistakes:
        key_takeaway = major_mistakes[0].get("strategic_lesson", "Focus on disciplined position-based play.")
    elif won_hand:
        key_takeaway = "Flawless hand execution. You extracted maximum value while respecting pot odds and board texture."
    else:
        key_takeaway = "Solid fundamental decisions. Remember that poker is a game of probability; good decisions sometimes lose to short-term variance."

    return {
        "overall_grade": overall_grade,
        "overall_score": avg_score,
        "won_hand": won_hand,
        "hero_net": hero_payout,
        "final_hand": final_eval.description if final_eval else "Preflop fold",
        "decisions_reviewed": decisions,
        "mistakes_count": len(major_mistakes),
        "major_mistakes": major_mistakes,
        "key_takeaway": key_takeaway,
        "hand_summary": hand_summary
    }

def answer_coaching_question(question: str, hand_context: Optional[Dict] = None) -> Dict[str, str]:
    q_lower = question.lower()
    
    if "pot odds" in q_lower or "how to calculate" in q_lower:
        return {
            "title": "Calculating Pot Odds in Texas Hold'em",
            "type": "mathematical_fact",
            "explanation": (
                "**Pot Odds Formula:**\n"
                "`Pot Odds % = Call Amount / (Current Pot + Call Amount) * 100%`\n\n"
                "**Example:**\n"
                "If the pot is $100 and your opponent bets $50, you must call $50 to win a total pot of $150 ($100 + $50).\n"
                "- Total pot after calling: $200\n"
                "- Required equity: 50 / 200 = **25%** (or 3:1 pot odds).\n\n"
                "If your hand has more than 25% equity (chance of winning), calling is mathematically profitable (+EV) in the long run!"
            ),
            "key_takeaway": "Compare your estimated equity to the pot odds. Equity > Pot Odds = profitable call."
        }

    if "continuation bet" in q_lower or "c-bet" in q_lower or "cbet" in q_lower:
        return {
            "title": "Continuation Betting (C-Bet) Strategy",
            "type": "strategic_principle",
            "explanation": (
                "A **continuation bet (c-bet)** is when the preflop aggressor continues their aggression by betting on the flop.\n\n"
                "**Why C-bet?**\n"
                "1. **Range Advantage:** The preflop raiser holds higher cards (AA, KK, AK) more frequently than the caller.\n"
                "2. **Flop Miss Frequency:** Opponents miss the flop entirely about 67% (2 out of 3) of the time!\n\n"
                "**Sizing Guidelines:**\n"
                "- Dry, disconnected boards (e.g., K♠ 8♦ 2♣): Bet small (25% - 33% of pot).\n"
                "- Wet, dynamic boards (e.g., J♥ T♥ 9♠): Bet larger (66% - 75% of pot) or check to pot-control."
            ),
            "key_takeaway": "C-bet dry boards frequently for a small size; check or bet larger on wet coordinated boards."
        }

    if "button" in q_lower or "utg" in q_lower or "position" in q_lower:
        return {
            "title": "Positional Power: Button vs Under The Gun (UTG)",
            "type": "strategic_principle",
            "explanation": (
                "In Texas Hold'em, **position is the single biggest determinant of win rate**.\n\n"
                "- **UTG (Under The Gun):** You act first on every postflop street, and there are still 5-8 players yet to act preflop. You can be dominated easily, so you only open top ~15% of hands.\n"
                "- **BTN (The Button):** You are guaranteed to act LAST on the Flop, Turn, and River. Having the last word lets you control pot size and see everyone's move first."
            ),
            "key_takeaway": "Play tight from early position (UTG) and expand your range dramatically as you approach the Button."
        }

    if "gto" in q_lower or "exploitative" in q_lower:
        return {
            "title": "GTO (Game Theory Optimal) vs Exploitative Play",
            "type": "strategic_framework",
            "explanation": (
                "**Game Theory Optimal (GTO):** An unexploitable equilibrium strategy mathematically balanced with value bets and bluffs.\n\n"
                "**Exploitative Play:** Identifying and actively attacking specific opponent mistakes (folding too much, calling stations, never bluffing).\n\n"
                "*Maximum Profit Rule:* Against recreational or imbalanced opponents, exploitative play yields significantly higher win rates than pure GTO!"
            ),
            "key_takeaway": "Use GTO as your unshakeable baseline, and diverge to exploitative lines whenever opponents have obvious leaks."
        }

    return {
        "title": "Poker Strategy Academy",
        "type": "strategic_principle",
        "explanation": (
            "No-Limit Texas Hold'em revolves around three core pillars:\n\n"
            "1. **Starting Hand Selection & Position:** Don't play weak offsuit cards out of position.\n"
            "2. **Pot Odds & Math:** Calculate the price of the pot vs your equity before calling.\n"
            "3. **Aggression & Initiative:** Bet and raise with your best hands and balanced semi-bluffs rather than passively calling down."
        ),
        "key_takeaway": "Aggressive, position-aware poker with solid fundamentals beats passive play every time."
    }
