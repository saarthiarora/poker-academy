import uuid
import json
from typing import Dict, List, Any, Optional
from collections import defaultdict
from app.database import get_connection

def record_completed_hand(
    hand_id: str,
    table_size: int,
    hero_position: str,
    hero_cards: List[str],
    board: List[str],
    pot_total: int,
    hero_net_chips: int,
    won_hand: bool,
    actions_taken: List[Dict],
    decisions: List[Dict]
) -> None:
    conn = get_connection()
    cursor = conn.cursor()

    # Preflop stats: VPIP, PFR, 3-bet
    vpip = 0
    pfr = 0
    three_bet = 0
    folded_to_3bet = 0
    aggression_count = 0
    passive_count = 0

    preflop_actions = [a for a in actions_taken if a.get("street") == "preflop" and a.get("player_id") == "hero"]
    for act in preflop_actions:
        a_type = act.get("action", "").lower()
        if a_type in ("call", "raise", "bet", "all_in"):
            vpip = 1
        if a_type in ("raise", "bet", "all_in"):
            pfr = 1
            if act.get("is_three_bet"):
                three_bet = 1

    for act in actions_taken:
        if act.get("player_id") == "hero":
            a_type = act.get("action", "").lower()
            if a_type in ("bet", "raise", "all_in"):
                aggression_count += 1
            elif a_type in ("call", "check"):
                passive_count += 1

    cursor.execute("""
        INSERT INTO hands (
            id, table_size, hero_position, hero_cards, board,
            pot_total, hero_net_chips, won_hand,
            vpip, pfr, three_bet, folded_to_3bet, aggression_count, passive_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        hand_id,
        table_size,
        hero_position,
        ",".join(hero_cards),
        ",".join(board),
        pot_total,
        hero_net_chips,
        1 if won_hand else 0,
        vpip,
        pfr,
        three_bet,
        folded_to_3bet,
        aggression_count,
        passive_count
    ))

    # Record decisions
    for d in decisions:
        dec_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO decisions (
                id, hand_id, street, position, hero_cards,
                action_taken, recommended_action, grade, grade_score,
                feedback_reason, lesson
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dec_id,
            hand_id,
            d.get("street", ""),
            d.get("position", hero_position),
            d.get("hand_notation", ",".join(hero_cards)),
            d.get("action_taken", ""),
            d.get("recommended_action", ""),
            d.get("grade", "GOOD"),
            d.get("grade_score", 85),
            d.get("feedback_reason", ""),
            d.get("strategic_lesson", "")
        ))

    conn.commit()
    conn.close()

def get_overall_statistics(big_blind: int = 20) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM hands ORDER BY timestamp ASC")
    hands = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT * FROM decisions ORDER BY timestamp ASC")
    decisions = [dict(row) for row in cursor.fetchall()]

    conn.close()

    total_hands = len(hands)
    if total_hands == 0:
        return {
            "total_hands": 0,
            "hands_won": 0,
            "hands_lost": 0,
            "win_rate_pct": 0,
            "vpip_pct": 0,
            "pfr_pct": 0,
            "three_bet_pct": 0,
            "aggression_frequency": 0,
            "bb_per_100": 0,
            "total_profit_chips": 0,
            "avg_decision_score": 100,
            "decision_accuracy_pct": 100,
            "position_stats": {},
            "hand_category_stats": {},
            "common_mistakes": [],
            "recent_performance": []
        }

    hands_won = sum(1 for h in hands if h["won_hand"] == 1)
    hands_lost = total_hands - hands_won
    vpip_count = sum(h["vpip"] for h in hands)
    pfr_count = sum(h["pfr"] for h in hands)
    three_bet_count = sum(h["three_bet"] for h in hands)
    total_agg = sum(h["aggression_count"] for h in hands)
    total_pass = sum(h["passive_count"] for h in hands)
    total_actions = total_agg + total_pass

    vpip_pct = round((vpip_count / total_hands) * 100, 1)
    pfr_pct = round((pfr_count / total_hands) * 100, 1)
    three_bet_pct = round((three_bet_count / total_hands) * 100, 1)
    af = round((total_agg / total_actions) * 100, 1) if total_actions > 0 else 0.0

    total_profit_chips = sum(h["hero_net_chips"] for h in hands)
    total_bb_won = total_profit_chips / big_blind
    bb_per_100 = round((total_bb_won / total_hands) * 100, 2)

    # Position breakdown
    pos_data = defaultdict(lambda: {"hands": 0, "won": 0, "profit": 0, "vpip": 0, "pfr": 0})
    for h in hands:
        pos = h["hero_position"] or "Unknown"
        pos_data[pos]["hands"] += 1
        if h["won_hand"] == 1:
            pos_data[pos]["won"] += 1
        pos_data[pos]["profit"] += h["hero_net_chips"]
        pos_data[pos]["vpip"] += h["vpip"]
        pos_data[pos]["pfr"] += h["pfr"]

    formatted_pos = {}
    for pos, d in pos_data.items():
        formatted_pos[pos] = {
            "hands": d["hands"],
            "win_rate_pct": round((d["won"] / d["hands"]) * 100, 1),
            "profit_chips": d["profit"],
            "profit_bb": round(d["profit"] / big_blind, 1),
            "vpip_pct": round((d["vpip"] / d["hands"]) * 100, 1),
            "pfr_pct": round((d["pfr"] / d["hands"]) * 100, 1)
        }

    # Decision accuracy & mistakes
    total_decisions = len(decisions)
    if total_decisions > 0:
        avg_score = round(sum(d["grade_score"] for d in decisions) / total_decisions, 1)
        good_decisions = sum(1 for d in decisions if d["grade"] in ("EXCELLENT", "GOOD"))
        accuracy_pct = round((good_decisions / total_decisions) * 100, 1)
    else:
        avg_score = 100
        accuracy_pct = 100

    mistakes = [d for d in decisions if d["grade"] in ("SUBOPTIMAL", "MAJOR_MISTAKE")]
    mistake_counts = defaultdict(int)
    for m in mistakes:
        key = f"{m.get('street', 'preflop').upper()}: {m.get('position', '')} with {m.get('hero_cards', '')} ({m.get('action_taken', '')})"
        mistake_counts[key] += 1

    top_mistakes = sorted([{"description": k, "count": v} for k, v in mistake_counts.items()], key=lambda x: x["count"], reverse=True)[:5]

    # Performance trend over time (cumulative profit in chips and bb)
    cumulative = 0
    trend = []
    for idx, h in enumerate(hands):
        cumulative += h["hero_net_chips"]
        trend.append({
            "hand_index": idx + 1,
            "net": h["hero_net_chips"],
            "cumulative_chips": cumulative,
            "cumulative_bb": round(cumulative / big_blind, 1)
        })

    return {
        "total_hands": total_hands,
        "hands_won": hands_won,
        "hands_lost": hands_lost,
        "win_rate_pct": round((hands_won / total_hands) * 100, 1),
        "vpip_pct": vpip_pct,
        "pfr_pct": pfr_pct,
        "three_bet_pct": three_bet_pct,
        "aggression_frequency": af,
        "bb_per_100": bb_per_100,
        "total_profit_chips": total_profit_chips,
        "avg_decision_score": avg_score,
        "decision_accuracy_pct": accuracy_pct,
        "position_stats": formatted_pos,
        "common_mistakes": top_mistakes,
        "recent_performance": trend[-50:] # last 50 hands for chart
    }

def reset_all_statistics():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM decisions")
    cursor.execute("DELETE FROM hands")
    cursor.execute("DELETE FROM saved_analyses")
    conn.commit()
    conn.close()

