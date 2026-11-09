import React from 'react';
import { NavSection } from '../layout/Sidebar';
import { OverallStats } from '../../types/poker';
import {
  Spade,
  Bot,
  Grid,
  Search,
  Calculator,
  FlaskConical,
  TrendingUp,
  Play,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (section: NavSection) => void;
  stats: OverallStats | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, stats }) => {
  const modules = [
    {
      id: 'practice' as NavSection,
      title: 'Practice Table',
      desc: 'Play live No-Limit Texas Hold’em hands against 5 distinct AI personalities with full side pots and chip management.',
      icon: Spade,
      color: 'emerald',
      badge: 'Interactive'
    },
    {
      id: 'coach' as NavSection,
      title: 'AI Poker Coach',
      desc: 'Ask questions in real-time. Understand hand ranges, pot odds, continuation betting, and GTO principles.',
      icon: Bot,
      color: 'amber',
      badge: 'Smart Tutor'
    },
    {
      id: 'ranges' as NavSection,
      title: 'Starting Hand Charts',
      desc: '13 × 13 matrix of 169 hands. Filter by format (6-max, 9-max, heads-up), position, stack depth, and situation.',
      icon: Grid,
      color: 'blue',
      badge: 'Public Sources'
    },
    {
      id: 'analysis' as NavSection,
      title: 'Hand Analysis',
      desc: 'Manually configure hole cards, board texture, and pot size to calculate hand strength, equity, and expected value.',
      icon: Search,
      color: 'purple',
      badge: 'EV Solver'
    },
    {
      id: 'equity' as NavSection,
      title: 'Equity Calculator',
      desc: 'Simulate up to 100,000 deck runouts to calculate exact win, tie, and loss percentages with kicker tiebreakers.',
      icon: Calculator,
      color: 'cyan',
      badge: 'Monte Carlo'
    },
    {
      id: 'simulations' as NavSection,
      title: 'Simulations Lab',
      desc: 'Compare hands vs defined opponent ranges, all-in scenarios, and test your decision accuracy with interactive quizzes.',
      icon: FlaskConical,
      color: 'rose',
      badge: 'Drill Trainer'
    },
    {
      id: 'stats' as NavSection,
      title: 'Progress & HUD Statistics',
      desc: 'Track your real VPIP, PFR, 3-bet %, BB/100 win rate, position profitability, and common strategic leaks over time.',
      icon: TrendingUp,
      color: 'emerald',
      badge: 'Live Data'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/80 border border-emerald-500/30 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <Sparkles size={14} className="text-amber-400" />
            <span>Texas Hold'em Poker Academy 1.0</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            Master No-Limit Hold'em with Mathematical Precision & AI Coaching
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Train against realistic simulated AI opponents, study 169-hand preflop ranges, run Monte Carlo simulations, and receive real-time coaching feedback on every decision.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('practice')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-900/40 active:scale-95 transition-all"
            >
              <Play size={16} />
              <span>Enter Practice Table</span>
            </button>

            <button
              onClick={() => onNavigate('ranges')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-all"
            >
              <Grid size={16} className="text-amber-400" />
              <span>Explore Starting Ranges</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live HUD Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hands Played</span>
          <span className="font-mono font-black text-2xl text-white mt-1 block">
            {stats?.total_hands || 0}
          </span>
          <span className="text-[10px] text-slate-400">Total practice hands</span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Win Rate</span>
          <span className="font-mono font-black text-2xl text-emerald-400 mt-1 block">
            {stats?.bb_per_100 || 0} <span className="text-xs text-slate-400">BB/100</span>
          </span>
          <span className="text-[10px] text-slate-400">Hands won: {stats?.hands_won || 0}</span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">VPIP / PFR</span>
          <span className="font-mono font-black text-2xl text-amber-400 mt-1 block">
            {stats?.vpip_pct || 0}% / {stats?.pfr_pct || 0}%
          </span>
          <span className="text-[10px] text-slate-400">Voluntarily Put $ / Preflop Raise</span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision Accuracy</span>
          <span className="font-mono font-black text-2xl text-emerald-300 mt-1 block">
            {stats?.decision_accuracy_pct || 100}%
          </span>
          <span className="text-[10px] text-slate-400">Optimal decisions graded</span>
        </div>
      </div>

      {/* Training Modules Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Award size={18} className="text-amber-400" />
          <span>Core Training Modules</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                onClick={() => onNavigate(m.id)}
                className="group bg-slate-950/90 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 p-6 rounded-3xl shadow-xl cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 group-hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-inner">
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      {m.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-900 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                  <span>Open Module</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-emerald-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

