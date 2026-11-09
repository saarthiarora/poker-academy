import React from 'react';
import { HandReviewData, CardData } from '../../types/poker';
import { PlayingCard } from '../common/PlayingCard';
import { X, Award, AlertCircle, TrendingUp, CheckCircle, Lightbulb } from 'lucide-react';

interface HandReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: HandReviewData | null;
  heroCards?: CardData[];
  board?: CardData[];
  onNextHand: () => void;
}

export const HandReviewModal: React.FC<HandReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  heroCards = [],
  board = [],
  onNextHand
}) => {
  if (!isOpen || !review) return null;

  const isWin = review.won_hand;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className={`p-6 border-b border-slate-800 ${isWin ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900' : 'bg-gradient-to-r from-slate-950 to-slate-900'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${isWin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                {isWin ? '🏆' : '📊'}
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {isWin ? 'Hand Won!' : 'Hand Review'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isWin ? `Won +${review.hero_net.toLocaleString()} chips` : 'Comprehensive Strategy Evaluation'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cards Display */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Cards</span>
              <div className="flex gap-1.5">
                {heroCards.map((c, i) => (
                  <PlayingCard key={i} card={c} size="sm" />
                ))}
              </div>
            </div>

            {board.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Board</span>
                <div className="flex gap-1.5">
                  {board.map((c, i) => (
                    <PlayingCard key={i} card={c} size="sm" />
                  ))}
                </div>
              </div>
            )}

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Final Result</span>
              <span className="font-bold text-slate-200 text-xs">{review.final_hand}</span>
            </div>
          </div>
        </div>

        {/* Decisions Graded List */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={16} className="text-amber-400" />
              <span>Decisions Evaluated ({review.decisions_reviewed?.length || 0})</span>
            </h4>
            <span className="text-xs font-mono font-bold text-slate-400">
              Session Score: <strong className="text-amber-300">{review.overall_score}%</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {review.decisions_reviewed?.map((dec, i) => (
              <div
                key={i}
                className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300">
                      {dec.street}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      Action: <span className="capitalize font-black text-amber-400">{dec.action_taken}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    {dec.feedback_reason}
                  </p>
                  {dec.alternative_action && (
                    <p className="text-[11px] text-amber-400/90 font-medium">
                      💡 <em>Alternative:</em> {dec.alternative_action}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-black border ${
                  dec.grade === 'EXCELLENT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  dec.grade === 'GOOD' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  dec.grade === 'SUBOPTIMAL' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {dec.grade_badge}
                </span>
              </div>
            ))}
          </div>

          {/* Key Lesson */}
          <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
            <Lightbulb size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
                Coach Lesson
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {review.key_takeaway}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Close Review
          </button>
          <button
            onClick={() => {
              onClose();
              onNextHand();
            }}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-extrabold shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
          >
            Deal Next Hand →
          </button>
        </div>
      </div>
    </div>
  );
};

