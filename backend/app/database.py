import sqlite3
import os
from typing import Dict, List, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "..", "poker_academy.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Hands table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hands (
            id TEXT PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            table_size INTEGER,
            hero_position TEXT,
            hero_cards TEXT,
            board TEXT,
            pot_total INTEGER,
            hero_net_chips INTEGER,
            won_hand INTEGER,
            vpip INTEGER,
            pfr INTEGER,
            three_bet INTEGER,
            folded_to_3bet INTEGER,
            aggression_count INTEGER,
            passive_count INTEGER
        )
    """)

    # Decisions / Mistakes table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS decisions (
            id TEXT PRIMARY KEY,
            hand_id TEXT,
            street TEXT,
            position TEXT,
            hero_cards TEXT,
            action_taken TEXT,
            recommended_action TEXT,
            grade TEXT,
            grade_score INTEGER,
            feedback_reason TEXT,
            lesson TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(hand_id) REFERENCES hands(id)
        )
    """)

    # Saved Hand Analyses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_analyses (
            id TEXT PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            title TEXT,
            hero_cards TEXT,
            board_cards TEXT,
            position TEXT,
            pot_size INTEGER,
            situation_details TEXT,
            recommended_action TEXT,
            equity_pct REAL,
            notes TEXT
        )
    """)

    conn.commit()
    conn.close()

# Auto-initialize database on import
init_db()

