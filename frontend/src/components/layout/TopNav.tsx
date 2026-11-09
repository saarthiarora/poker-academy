import React from 'react';
import { RefreshCw, Users, Shield, Sparkles, Coins } from 'lucide-react';
import { GameState } from '../../types/poker';

interface TopNavProps {
  gameState: GameState | null;
  onTableSizeChange: (size: number) => void;
  onNextHand: () => void;
  coachingMode: boolean;
  onToggleCoachingMode: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  gameState,
  onTableSizeChange,
  onNextHand,
  coachingMode,
  onToggleCoachingMode
}) => {
  const hero = gameState?.players[0];
  const tableSize = gameState?.table_size || 6;

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Table Size Format Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <Users size={14} className="ml-1 text-slate-400" />
          <span className="text-[11px] uppercase tracking-wider text-slate-500 mr-1">Table:</span>
          {[2, 6, 9].map((size) => (
            <button
              key={size}
              onClick={() => onTableSizeChange(size)}
              className={`
                px-2.5 py-1 rounded-lg text-xs font-bold transition-all
                ${tableSize === size
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              {size === 2 ? 'Heads-Up (2)' : `${size}-Max`}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-slate-800/60 rounded-xl text-xs text-slate-300">
          <span className="text-slate-500">Blinds:</span>
          <span className="font-mono font-bold text-amber-400">10 / 20</span>
        </div>
      </div>

      {/* Right: Chip stack & Controls */}
      <div className="flex items-center gap-4">
        {/* Hero Chip Count */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-inner">
          <Coins size={16} className="text-amber-400" />
          <div className="text-xs">
            <span className="text-slate-400 mr-1 font-medium">Stack:</span>
            <span className="font-mono font-extrabold text-amber-300 text-sm">
              {hero?.chips.toLocaleString() ?? '2,000'}
            </span>
          </div>
        </div>

        {/* Coaching Mode Pill */}
        <button
          onClick={onToggleCoachingMode}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
            ${coachingMode
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }
          `}
        >
          <Sparkles size={14} className={coachingMode ? 'text-amber-400 animate-spin-slow' : 'text-slate-500'} />
          <span>{coachingMode ? 'Coach Active' : 'Normal Play'}</span>
        </button>

        {/* Deal Next Hand */}
        <button
          onClick={onNextHand}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-900/30 active:scale-95 transition-all"
        >
          <RefreshCw size={14} />
          <span>Next Hand</span>
        </button>
      </div>
    </header>
  );
};

