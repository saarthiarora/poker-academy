import React, { useState, useEffect } from 'react';
import { LegalActions } from '../../types/poker';

interface ActionControlsProps {
  legalActions: LegalActions | null | undefined;
  onAction: (action: string, amount?: number) => void;
  disabled?: boolean;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  legalActions,
  onAction,
  disabled = false
}) => {
  if (!legalActions) return null;

  const [betAmount, setBetAmount] = useState<number>(legalActions.min_raise || 40);

  useEffect(() => {
    if (legalActions.min_raise) {
      setBetAmount(legalActions.min_raise);
    }
  }, [legalActions.min_raise]);

  const handleQuickBet = (amt: number) => {
    setBetAmount(amt);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(Number(e.target.value));
  };

  const isRaise = legalActions.can_call;

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-4xl mx-auto w-full">
      {/* Quick Bet Buttons & Slider */}
      {legalActions.can_raise && (
        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Bets (% Pot):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(legalActions.quick_bets || {}).map(([pct, amt]) => (
                <button
                  key={pct}
                  disabled={disabled}
                  onClick={() => handleQuickBet(amt)}
                  className={`
                    px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all
                    ${betAmount === amt
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  {pct} ({amt})
                </button>
              ))}
              <button
                disabled={disabled}
                onClick={() => handleQuickBet(legalActions.max_raise)}
                className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-red-950/40 border border-red-700/50 text-red-300 hover:bg-red-900/60 transition-all"
              >
                Max / All-In
              </button>
            </div>
          </div>

          {/* Slider & Custom Amount Input */}
          <div className="flex items-center gap-4 pt-1">
            <input
              type="range"
              min={legalActions.min_raise}
              max={legalActions.max_raise}
              step={10}
              value={betAmount}
              disabled={disabled}
              onChange={handleSliderChange}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 min-w-[120px] justify-center">
              <span className="text-amber-400 font-bold">$</span>
              <input
                type="number"
                min={legalActions.min_raise}
                max={legalActions.max_raise}
                value={betAmount}
                disabled={disabled}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-transparent font-mono font-extrabold text-white text-sm w-20 text-center outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Poker Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Fold */}
        <button
          disabled={disabled || !legalActions.can_fold}
          onClick={() => onAction('fold')}
          className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-600/50 text-slate-300 hover:text-red-400 font-bold text-sm tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Fold
        </button>

        {/* Check */}
        {legalActions.can_check && (
          <button
            disabled={disabled}
            onClick={() => onAction('check')}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-600/50 text-white font-extrabold text-sm tracking-wide shadow-md shadow-slate-900/50 transition-all active:scale-95 disabled:opacity-40"
          >
            Check
          </button>
        )}

        {/* Call */}
        {legalActions.can_call && (
          <button
            disabled={disabled}
            onClick={() => onAction('call')}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 border border-blue-500/50 text-white font-extrabold text-sm tracking-wide shadow-md shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-40"
          >
            Call ${legalActions.call_amount}
          </button>
        )}

        {/* Bet / Raise */}
        {legalActions.can_raise && (
          <button
            disabled={disabled}
            onClick={() => onAction(isRaise ? 'raise' : 'bet', betAmount)}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-400/50 text-white font-extrabold text-sm tracking-wide shadow-md shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-40"
          >
            {isRaise ? `Raise to $${betAmount}` : `Bet $${betAmount}`}
          </button>
        )}

        {/* All-in */}
        {legalActions.can_all_in && (
          <button
            disabled={disabled}
            onClick={() => onAction('all_in')}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-400/50 text-slate-950 font-black text-sm tracking-wider shadow-md shadow-amber-900/40 transition-all active:scale-95 disabled:opacity-40"
          >
            All-In (${legalActions.max_raise})
          </button>
        )}
      </div>
    </div>
  );
};
