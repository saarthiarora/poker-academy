import React, { useState, useEffect } from 'react';
import { CoachingFeedback } from '../../types/poker';
import { Bot, ChevronDown, ChevronUp, Sparkles, Lightbulb, X, Award, CheckCircle } from 'lucide-react';
import { sound } from '../../utils/audio';

interface CoachingDialogProps {
  feedback: CoachingFeedback | null;
  onClose: () => void;
}

export const CoachingDialog: React.FC<CoachingDialogProps> = ({ feedback, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!feedback) return;

    // Trigger specific sound based on Chess.com rating
    if (feedback.grade === 'BRILLIANT') {
      sound.playBrilliantChime();
    } else if (feedback.grade === 'BEST' || feedback.grade === 'EXCELLENT' || feedback.grade === 'GOOD') {
      sound.playGoodMoveDing();
    } else if (feedback.grade === 'BLUNDER' || feedback.grade === 'MISTAKE') {
      sound.playBlunderCue();
    }
  }, [feedback]);

  if (!feedback) return null;

  // Chess.com style colors and badges
  const badgeStyle: Record<string, string> = {
    BRILLIANT: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.5)] ring-2 ring-cyan-400/40',
    BEST: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    EXCELLENT: 'bg-blue-500/20 text-blue-300 border-blue-400/70',
    GOOD: 'bg-teal-500/20 text-teal-300 border-teal-400/60',
    ACCEPTABLE: 'bg-slate-700/40 text-slate-300 border-slate-600',
    INACCURACY: 'bg-amber-500/20 text-amber-300 border-amber-400/70',
    SUBOPTIMAL: 'bg-amber-500/20 text-amber-300 border-amber-400/70',
    MISTAKE: 'bg-orange-500/20 text-orange-300 border-orange-500/80',
    MAJOR_MISTAKE: 'bg-rose-500/25 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
    BLUNDER: 'bg-rose-500/25 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
  };

  const isPositive = ['BRILLIANT', 'BEST', 'EXCELLENT', 'GOOD'].includes(feedback.grade);

  return (
    <div className="fixed bottom-28 right-6 z-40 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-950/95 border-2 border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Chess.com Style Move Rating Banner */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
              <Bot size={18} />
            </div>
            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${badgeStyle[feedback.grade] || badgeStyle.GOOD}`}>
                {feedback.grade_badge || feedback.grade}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              {feedback.street} • {feedback.position}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Coach Voice Commentary */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {feedback.feedback_reason}
          </p>

          {/* Action Comparison Pills */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">You Played</span>
              <span className="font-extrabold text-white capitalize">{feedback.action_taken}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">Best Move</span>
              <span className="font-extrabold text-emerald-400 capitalize">{feedback.recommended_action}</span>
            </div>
          </div>

          {/* Expandable Deep Analysis Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
          >
            <span>{showDetails ? 'Hide Deep Analysis' : 'Why is this the best move?'}</span>
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Deep Analysis Drawer */}
          {showDetails && (
            <div className="space-y-2.5 pt-1 animate-in fade-in duration-150 text-xs">
              {feedback.pot_odds_pct > 0 && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
                  <span className="text-slate-400">Required Pot Odds:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {feedback.pot_odds_pct}% ({feedback.pot_odds_ratio})
                  </span>
                </div>
              )}

              {feedback.alternative_action && (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-amber-400">Alternative: </strong>
                  {feedback.alternative_action}
                </div>
              )}

              <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl text-amber-200/90 text-[11px]">
                <Lightbulb size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-300">Principle: </strong>
                  {feedback.strategic_lesson}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
