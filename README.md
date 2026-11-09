# Texas Hold'em Poker Academy ♠ ♥ ♦ ♣

A professional, interactive web application and personal training platform for **No-Limit Texas Hold'em poker**. Designed with the sleek, high-contrast dark aesthetic of **GTO Wizard**, **PokerStars**, and modern financial analytics terminals.

---

## 🌟 Key Features

### 1. Dashboard
- Overview terminal with real-time HUD stats (Hands Played, BB/100 Win Rate, VPIP, PFR, Decision Accuracy).
- One-click access to all 7 interactive training modules.

### 2. Practice Table (Core Feature)
- **Table Sizes:** 2-Player Heads-Up, 6-Max, and 9-Max full ring.
- **AI Opponent Personalities:**
  - **Tight-Passive ("The Rock"):** Selective, rarely bluffs, checks and calls with made hands.
  - **Tight-Aggressive ("TAG"):** Selective preflop, applies high pressure with c-bets and value bets.
  - **Loose-Aggressive ("LAG"):** Wide range, frequent raises and bluffs, floats postflop.
  - **Loose-Passive ("Calling Station"):** High VPIP, rarely folds pairs or draws, rarely raises.
  - **Balanced ("GTO Strategist"):** Calculates pot odds, balances value and bluffs.
- **Complete No-Limit Texas Hold'em Rules:**
  - Small Blind & Big Blind rotation.
  - Special Heads-Up rules (Dealer is SB and acts first preflop, last postflop).
  - Main pot and multi-tier side pots.
  - Uncalled bet refunds.
  - All-in runouts to showdown.
  - Strict chip conservation (chips never created or destroyed).
- **Interactive Action Controls:**
  - Quick bet percentages: 25%, 33%, 50%, 66%, 75%, 100%, 150% pot.
  - Fine-grained slider & numerical chip input.
  - Fold, Check, Call, Bet/Raise, All-In.
- **Training Modes:**
  - **Normal Mode:** Play continuously without interruptions.
  - **Coaching Mode:** After each hero decision, the AI coach immediately provides situation breakdown, pot odds, recommended action, and lessons.

### 3. AI Poker Coach
- Real-time conversational tutor answering poker strategy and math questions.
- Integrated with live table context (current hole cards, board, position, pot).
- Evaluates user decisions into 5 tiers:
  - ⭐ **Optimal** (100%)
  - 👍 **Solid** (85%)
  - ⚖️ **Playable** (70%)
  - ⚠️ **Inaccurate** (45%)
  - ❌ **Blunder** (15%)
- Comprehensive Post-Hand Review generated at the end of every hand.

### 4. Starting Hand Charts (13 × 13 Matrix)
- Full 169-hand grid: Pocket pairs along diagonal, suited hands above diagonal, offsuit below diagonal.
- Configurable filters:
  - Format: 6-Max, 9-Max, Heads-Up.
  - Position: UTG, UTG+1, LJ, HJ, CO, Button, Small Blind, Big Blind.
  - Situation: Raise First In (RFI), Facing Open, Facing 3-Bet, Facing 4-Bet, BB Defense.
  - Stack Depth: 20 BB, 40 BB, 60 BB, 100 BB, 150 BB.
- **Publicly Sourced & Attributed:**
  - Upswing Poker (Doug Polk & Ryan Fee)
  - PokerCoaching (Jonathan Little)
  - PokerStars Learn Fundamentals

### 5. Hand Analysis & EV Calculator
- Interactive card picker for hero hole cards and 0-5 community cards.
- Configurable positions, pot sizes, and bets to call.
- Computes hand ranking, equity vs range, pot odds, and expected value (+/- EV).
- Save analyzed hands to personal history.

### 6. Monte Carlo Equity Calculator
- Evaluates equity across 2 to 6 players with explicit hole cards or random ranges.
- Configurable simulation depth: 1,000, 10,000, and 100,000 runs.
- Output breakdown: Win %, Tie %, Loss %, Equity %, and made hand distribution (High Card, Pairs, Trips, Straight, Flush, Full House, Quads, Straight Flush).

### 7. Simulation Lab & Decision Drills
- **Hand vs Hand:** Simulates head-to-head equity across thousands of random boards.
- **Hand vs Range:** Evaluates hero cards against Top 5%, Top 10%, Top 20%, Pocket Pairs, Broadways, or Suited Connectors.
- **Decision Drill Quiz:** Interactive poker puzzle scenarios testing GTO vs exploitative decisions with instant scoring.

### 8. Progress & HUD Statistics
- Tracks actual hands played at the virtual table.
- Metrics: VPIP %, PFR %, 3-Bet %, Aggression Frequency (AF), BB/100 Win Rate.
- Profitability by position (BTN, SB, BB, UTG, HJ, CO).
- Cumulative profit curve over time.
- Top identified strategic leaks and mistakes.

---

## 🏗️ Technical Architecture

### Backend (Python + FastAPI)
```
backend/
├── app/
│   ├── main.py                     # FastAPI application & static mounting
│   ├── database.py                 # SQLite database initialization
│   ├── engine/
│   │   ├── card.py                 # Card rank/suit logic, parsing, symbols
│   │   ├── deck.py                 # 52-card deck, shuffling, drawing
│   │   ├── hand_evaluator.py       # Combinatorial 7-card poker hand evaluator
│   │   ├── pot_manager.py          # Main pot, side pots, uncalled bet refunds
│   │   ├── opponent_ai.py          # 5 personality types (TAG, LAG, Rock, Station, GTO)
│   │   ├── game_state.py           # Complete No-Limit Hold'em state machine
│   │   └── equity_calculator.py    # Monte Carlo simulation engine
│   ├── services/
│   │   ├── coaching_service.py     # Decision analysis & conversational coaching
│   │   ├── range_service.py        # 169-hand matrix generator & source attribution
│   │   ├── simulation_service.py   # Range vs range & quiz drills
│   │   └── stats_service.py        # VPIP, PFR, AF, BB/100 tracker
│   └── routers/
│       ├── game.py                 # Table endpoints & turn execution
│       ├── coach.py                # AI coach Q&A
│       ├── ranges.py               # 13x13 preflop matrix endpoints
│       ├── equity.py               # Monte Carlo equity calculator
│       ├── simulations.py          # Lab simulations & quiz drills
│       ├── analysis.py             # Custom hand EV analyzer
│       └── stats.py                # HUD statistics & performance curves
└── tests/
    ├── test_hand_evaluator.py      # Hand rankings & kicker tiebreakers
    ├── test_game_engine.py         # Blinds, action orders, chip conservation
    ├── test_pot_manager.py         # Side pots & uncalled bet refunds
    ├── test_equity.py              # Monte Carlo equity accuracy
    └── test_api_integration.py     # Full API router integration
```

### Frontend (React + TypeScript + Tailwind CSS)
```
frontend/
├── src/
│   ├── types/poker.ts              # Data contracts and API schemas
│   ├── api/client.ts               # Type-safe API client
│   ├── components/
│   │   ├── common/                 # PlayingCard, CardSelector
│   │   ├── layout/                 # Sidebar (8 sections), TopNav
│   │   ├── table/                  # PokerTable, ActionControls, CoachingDialog, HandReviewModal
│   │   ├── charts/                 # RangeChartView (13x13 matrix)
│   │   ├── coach/                  # CoachView (conversational AI tutor)
│   │   ├── analysis/               # HandAnalysisView (EV calculator)
│   │   ├── equity/                 # EquityCalcView (Monte Carlo simulator)
│   │   ├── simulations/            # SimulationsLabView (Hand vs Range & Quiz)
│   │   ├── stats/                  # StatisticsView (Recharts graphs & HUD)
│   │   └── dashboard/              # DashboardView (Overview terminal)
│   ├── App.tsx                     # Main application layout
│   └── index.css                   # Custom theme, felt gradient, wood rail
```

---

## 🚀 Running the Application

### Option A: Unified Server (Recommended)
Builds and serves both backend and frontend on a single port:

```bash
# 1. Run the unified server
python run.py
```
Open **`http://localhost:8000`** in your browser.
API documentation is available at **`http://localhost:8000/docs`**.

### Option B: Frontend Development Mode (Hot Reloading)
For live frontend development:

```bash
# Terminal 1: Backend
python run.py

# Terminal 2: Frontend Vite Dev Server
cd frontend
pnpm dev
```
Open **`http://localhost:5173`** in your browser (proxies API requests to port 8000).

---

## 🧪 Running Automated Tests

Run the complete 30-test suite verifying hand evaluations, tiebreakers, split pots, side pots, chip accounting, Monte Carlo equity, and API routers:

```bash
python -m unittest discover backend/tests
```
All tests run deterministically in under 3 seconds.

