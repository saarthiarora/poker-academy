import React from 'react';
import {
  LayoutDashboard,
  Spade,
  Bot,
  Grid,
  Search,
  Calculator,
  FlaskConical,
  TrendingUp,
  GraduationCap
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'practice'
  | 'coach'
  | 'ranges'
  | 'analysis'
  | 'equity'
  | 'simulations'
  | 'stats';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  coachingMode: boolean;
  onToggleCoachingMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  coachingMode,
  onToggleCoachingMode
}) => {
  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'practice' as NavSection, label: 'Practice Table', icon: Spade, badge: 'Live' },
    { id: 'coach' as NavSection, label: 'AI Poker Coach', icon: Bot, highlight: true },
    { id: 'ranges' as NavSection, label: 'Starting Hand Charts', icon: Grid },
    { id: 'analysis' as NavSection, label: 'Hand Analysis', icon: Search },
    { id: 'equity' as NavSection, label: 'Equity Calculator', icon: Calculator },
    { id: 'simulations' as NavSection, label: 'Simulations Lab', icon: FlaskConical },
    { id: 'stats' as NavSection, label: 'Progress & Statistics', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between select-none h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
            <GraduationCap size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              POKER ACADEMY
            </h1>
            <p className="text-[11px] text-amber-400/90 font-medium tracking-wide uppercase">
              Texas Hold'em GTO
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-800/20 text-emerald-400 border border-emerald-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={isActive ? 'text-emerald-400' : item.highlight ? 'text-amber-400' : 'text-slate-400'}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Coach Switch */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 m-3 rounded-2xl border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-amber-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">Coaching Mode</div>
              <div className="text-[10px] text-slate-400">Instant decision feedback</div>
            </div>
          </div>
          <button
            onClick={onToggleCoachingMode}
            className={`
              w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out
              ${coachingMode ? 'bg-amber-500 justify-end' : 'bg-slate-700 justify-start'}
            `}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md" />
          </button>
        </div>
      </div>
    </aside>
  );
};

