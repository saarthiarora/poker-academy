import {
  GameState,
  RangeMatrixResponse,
  EquityResponse,
  OverallStats,
  CoachingFeedback,
  HandReviewData
} from '../types/poker';

const API_BASE = '/api';

export const api = {
  // Game Table
  async startNewGame(table_size = 6, starting_stack = 2000): Promise<GameState> {
    const res = await fetch(`${API_BASE}/game/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_size, starting_stack, small_blind: 10, big_blind: 20 })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getGameState(): Promise<GameState> {
    const res = await fetch(`${API_BASE}/game/state`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async setTableSize(table_size: number): Promise<GameState> {
    const res = await fetch(`${API_BASE}/game/set-table-size`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_size })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async nextHand(): Promise<GameState> {
    const res = await fetch(`${API_BASE}/game/next-hand`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async executeAction(action: string, amount = 0, coaching_mode = false): Promise<GameState> {
    const res = await fetch(`${API_BASE}/game/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, amount, coaching_mode })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Action failed' }));
      throw new Error(err.detail || 'Action failed');
    }
    return res.json();
  },

  async getHandReview(): Promise<{ has_review: boolean; review?: HandReviewData; message?: string }> {
    const res = await fetch(`${API_BASE}/game/hand-review`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Range Charts
  async getRangeMatrix(table_format = '6max', position = 'BTN', situation = 'rfi', stack_depth = '100bb'): Promise<RangeMatrixResponse> {
    const query = new URLSearchParams({ table_format, position, situation, stack_depth });
    const res = await fetch(`${API_BASE}/ranges/matrix?${query.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Equity Calculator
  async calculateEquity(players: any[], board: string[] = [], num_simulations = 10000): Promise<EquityResponse> {
    const res = await fetch(`${API_BASE}/equity/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players, board, num_simulations })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Simulations
  async simulateHandVsHand(hand1: string[], hand2: string[], board: string[] = [], simulations = 5000) {
    const res = await fetch(`${API_BASE}/simulations/hand-vs-hand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hand1, hand2, board, simulations })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async simulateHandVsRange(hero_cards: string[], range_target: string | string[], board: string[] = [], simulations = 5000) {
    const res = await fetch(`${API_BASE}/simulations/hand-vs-range`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_cards, range_target, board, simulations })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getQuizScenario() {
    const res = await fetch(`${API_BASE}/simulations/quiz`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async checkQuizAnswer(quiz_id: string, selected_action: string) {
    const res = await fetch(`${API_BASE}/simulations/quiz/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id, selected_action })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Coach Q&A
  async askCoach(question: string, hand_context?: any) {
    const res = await fetch(`${API_BASE}/coach/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, hand_context })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Hand Analysis
  async evaluateHandAnalysis(payload: any) {
    const res = await fetch(`${API_BASE}/analysis/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getSavedAnalyses() {
    const res = await fetch(`${API_BASE}/analysis/saved`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async saveAnalysis(payload: any) {
    const res = await fetch(`${API_BASE}/analysis/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Statistics
  async getStatistics(): Promise<OverallStats> {
    const res = await fetch(`${API_BASE}/stats/overview`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async resetStatistics() {
    const res = await fetch(`${API_BASE}/stats/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

