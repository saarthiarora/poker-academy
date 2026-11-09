import React from 'react';
import { PlayerData } from '../../types/poker';
import { X, Shield, Swords, Target, UserCheck } from 'lucide-react';

interface OpponentModalProps {
  player: PlayerData | null;
  onClose: () => void;
}

const ARCHETYPE_GUIDES: Record<string, {
  tagline: string;
  tendencies: string;
  counterStrategy: string;
  vpipRange: string;
  pfrRange: string;
  aggressionRate: string;
}> = {
  tight_passive: {
    tagline: "The Rock / Nit",
    tendencies: "Enters few pots (only premium cards). Rarely raises, bluffs, or semi-bluffs. Bets and raises exclusively when holding strong made hands.",
    counterStrategy: "Steal their blinds relentlessly. When they check, bet small to fold them out. If they raise you, fold immediately unless you hold the nuts.",
    vpipRange: "12% - 15%",
    pfrRange: "4% - 8%",
    aggressionRate: "Low (20%)"
  },
  tight_aggressive: {
    tagline: "TAG (Tight-Aggressive)",
    tendencies: "Selective with starting hands, but applies immense pressure postflop with frequent continuation bets and value bets.",
    counterStrategy: "Do not contest pots lightly out of position. Target their c-bets by check-raising when the board favors your defending range.",
    vpipRange: "20% - 24%",
    pfrRange: "17% - 20%",
    aggressionRate: "High (75%)"
  },
  loose_aggressive: {
    tagline: "LAG (Loose-Aggressive Maverick)",
    tendencies: "Plays wide preflop ranges. Raises, 3-bets, and applies maximum postflop pressure with both value and air bluffs.",
    counterStrategy: "Widen your calling and value-raising ranges. Induce bluffs by checking strong hands. Avoid folding marginal top pairs too easily.",
    vpipRange: "35% - 45%",
    pfrRange: "28% - 35%",
    aggressionRate: "Very High (85%)"
  },
  loose_passive: {
    tagline: "Calling Station",
    tendencies: "Plays too many hands and hates folding any pair or draw, but almost never raises.",
    counterStrategy: "NEVER bluff a calling station. Bet large for pure value whenever you have top pair or better. Never slowplay.",
    vpipRange: "40% - 55%",
    pfrRange: "5% - 12%",
    aggressionRate: "Very Low (15%)"
  },
  balanced: {
    tagline: "GTO Strategist",
    tendencies: "Calculates pot odds, sizes bets proportionally, and balances value hands with mathematically disciplined bluffs.",
    counterStrategy: "Play standard GTO lines. Avoid erratic imbalances or wild bluffs that get picked off by their balanced calling ranges.",
    vpipRange: "24% - 28%",
    pfrRange: "19% - 22%",
    aggressionRate: "Balanced (60%)"
  }
};

export const OpponentModal: React.FC<OpponentModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  const info = ARCHETYPE_GUIDES[player.personality] || ARCHETYPE_GUIDES.balanced;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
              {player.avatar}
            </div>
            <div>
              <h3 className="text-base font-black text-white">{player.name}</h3>
              <span className="text-xs font-bold text-amber-400 capitalize">
                {info.tagline}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tendency Stats */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated VPIP</span>
            <span className="font-mono font-black text-sm text-amber-300 mt-0.5 block">{info.vpipRange}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PFR %</span>
            <span className="font-mono font-black text-sm text-blue-300 mt-0.5 block">{info.pfrRange}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggression</span>
            <span className="font-mono font-black text-sm text-emerald-300 mt-0.5 block">{info.aggressionRate}</span>
          </div>
        </div>

        {/* Playing Style Analysis */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Shield size={14} className="text-blue-400" />
              <span>Playing Tendencies</span>
            </span>
            <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              {info.tendencies}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Target size={14} className="text-emerald-400" />
              <span>How to Exploit this Opponent</span>
            </span>
            <p className="text-emerald-200/90 leading-relaxed bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
              {info.counterStrategy}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

