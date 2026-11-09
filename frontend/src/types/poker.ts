export interface CardData {
  rank: number;
  rank_char: string;
  suit: 's' | 'h' | 'd' | 'c';
  symbol: string;
  code: string;
  is_red: boolean;
}

export interface PlayerData {
  id: string;
  name: string;
  chips: number;
  is_human: boolean;
  personality: string;
  avatar: string;
  folded: boolean;
  is_all_in: boolean;
  current_bet: number;
  total_hand_bet: number;
  has_acted: boolean;
  position: string;
  hole_cards: CardData[];
  hand_evaluation?: {
    category: number;
    category_name: string;
    description: string;
    best_cards: CardData[];
    score: number[];
  };
  show_cards: boolean;
}

export interface LegalActions {
  can_fold: boolean;
  can_check: boolean;
  can_call: boolean;
  call_amount: number;
  can_raise: boolean;
  can_all_in: boolean;
  min_raise: number;
  max_raise: number;
  pot_size: number;
  quick_bets: Record<string, number>;
}

export interface PotData {
  amount: number;
  eligible_player_ids: string[];
  winners: string[];
  payouts: Record<string, number>;
}

export interface ActionRecordData {
  player_id: string;
  player_name: string;
  action: string;
  amount: number;
  street: string;
  note?: string;
}

export interface CoachingFeedback {
  hand_notation: string;
  street: string;
  position: string;
  hand_category: string;
  hand_rank_desc: string;
  action_taken: string;
  action_amount: number;
  pot_size: number;
  call_amount: number;
  pot_odds_pct: number;
  pot_odds_ratio: string;
  recommended_action: string;
  grade: 'BRILLIANT' | 'BEST' | 'EXCELLENT' | 'GOOD' | 'INACCURACY' | 'MISTAKE' | 'BLUNDER' | 'ACCEPTABLE' | 'SUBOPTIMAL' | 'MAJOR_MISTAKE';
  grade_label: string;
  grade_color: string;
  grade_badge: string;
  grade_score: number;
  grade_sound?: string;
  feedback_reason: string;
  alternative_action: string;
  strategic_lesson: string;
}

export interface HandReviewData {
  overall_grade: string;
  overall_score: number;
  won_hand: boolean;
  hero_net: number;
  final_hand: string;
  decisions_reviewed: CoachingFeedback[];
  mistakes_count: number;
  major_mistakes: CoachingFeedback[];
  key_takeaway: string;
  hand_summary: any;
}

export interface GameState {
  game_id: string;
  hand_number: number;
  table_size: number;
  small_blind: number;
  big_blind: number;
  street: string;
  button_idx: number;
  current_player_idx: number;
  current_high_bet: number;
  pot_total: number;
  pots: PotData[];
  community_cards: CardData[];
  players: PlayerData[];
  legal_actions?: LegalActions | null;
  action_history: ActionRecordData[];
  hand_summary: any;
  payouts: Record<string, number>;
  coaching_feedback?: CoachingFeedback;
  ai_turn_logs?: Array<{ player: string; action: string; amount: number; reason: string }>;
  hand_review?: HandReviewData;
}

export interface MatrixCell {
  hand: string;
  type: 'pair' | 'suited' | 'offsuit';
  action: 'raise' | 'call' | '3bet' | 'mixed' | 'fold';
  color: 'green' | 'blue' | 'orange' | 'purple' | 'grey';
  frequency: number;
  reasoning: string;
  source_key: string;
  source: {
    name: string;
    author: string;
    url: string;
    game_type: string;
    assumptions: string;
  };
}

export interface RangeMatrixResponse {
  table_format: string;
  position: string;
  situation: string;
  stack_depth: string;
  action_counts: Record<string, number>;
  estimated_range_pct: number;
  matrix: MatrixCell[][];
  sources: Record<string, any>;
}

export interface EquityResultPlayer {
  player_id: string;
  label: string;
  wins: number;
  ties: number;
  losses: number;
  win_pct: number;
  tie_pct: number;
  loss_pct: number;
  equity_pct: number;
  hand_types: Record<string, number>;
}

export interface EquityResponse {
  num_simulations: number;
  board: CardData[];
  results: EquityResultPlayer[];
}

export interface PositionStat {
  hands: number;
  win_rate_pct: number;
  profit_chips: number;
  profit_bb: number;
  vpip_pct: number;
  pfr_pct: number;
}

export interface OverallStats {
  total_hands: number;
  hands_won: number;
  hands_lost: number;
  win_rate_pct: number;
  vpip_pct: number;
  pfr_pct: number;
  three_bet_pct: number;
  aggression_frequency: number;
  bb_per_100: number;
  total_profit_chips: number;
  avg_decision_score: number;
  decision_accuracy_pct: number;
  position_stats: Record<string, PositionStat>;
  common_mistakes: Array<{ description: string; count: number }>;
  recent_performance: Array<{ hand_index: number; net: number; cumulative_chips: number; cumulative_bb: number }>;
}

