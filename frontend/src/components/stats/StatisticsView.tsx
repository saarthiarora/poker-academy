import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { OverallStats } from '../../types/poker';
import { TrendingUp, BarChart2, Award, AlertTriangle, RefreshCw, Trash2, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export const StatisticsView: React.FC = () => {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getStatistics();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset all training statistics?")) {
      await api.resetStatistics();
      fetchStats();
    }
  };

  // Convert position stats for chart
  const positionChartData = stats?.position_stats
    ? Object.entries(stats.position_stats).map(([pos, data]) => ({
        position: pos,
        profit_bb: data.profit_bb,
        hands: data.hands,
        win_rate: data.win_rate_pct
      }))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <TrendingUp className="text-emerald-400" />
            <span>Personal Progress & Poker HUD Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real performance tracking calculated exclusively from hands played at the virtual table.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-700 hover:border-red-600/50 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
            <span>Reset Stats</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hands Played</span>
          <span className="font-mono font-black text-2xl text-white mt-1 block">
            {stats?.total_hands || 0}
          </span>
          <span className="text-[10px] text-slate-400">{stats?.hands_won || 0} won ({stats?.win_rate_pct || 0}%)</span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Win Rate</span>
          <span className="font-mono font-black text-2xl text-emerald-400 mt-1 block">
            {stats?.bb_per_100 || 0} <span className="text-xs text-slate-400">BB/100</span>
          </span>
          <span className="text-[10px] text-slate-400">Net: ${stats?.total_profit_chips?.toLocaleString() || 0}</span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">VPIP %</span>
          <span className="font-mono font-black text-2xl text-amber-400 mt-1 block">
            {stats?.vpip_pct || 0}%
          </span>
          <span className="text-[10px] text-slate-400">Target: 22-28%</span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PFR %</span>
          <span className="font-mono font-black text-2xl text-blue-400 mt-1 block">
            {stats?.pfr_pct || 0}%
          </span>
          <span className="text-[10px] text-slate-400">Preflop Raise %</span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggression (AF)</span>
          <span className="font-mono font-black text-2xl text-purple-400 mt-1 block">
            {stats?.aggression_frequency || 0}%
          </span>
          <span className="text-[10px] text-slate-400">Bet/Raise Ratio</span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coach Accuracy</span>
          <span className="font-mono font-black text-2xl text-emerald-300 mt-1 block">
            {stats?.decision_accuracy_pct || 100}%
          </span>
          <span className="text-[10px] text-slate-400">Optimal Moves</span>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative Profit Chart */}
        <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl shadow-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <span>Cumulative Profit (Big Blinds) Over Time</span>
          </h3>

          <div className="h-64 w-full">
            {stats && stats.recent_performance && stats.recent_performance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.recent_performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hand_index" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative_bb"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Play hands at the virtual table to plot your win rate curve.
              </div>
            )}
          </div>
        </div>

        {/* Profit by Position Chart */}
        <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl shadow-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} className="text-amber-400" />
            <span>Profitability by Table Position (BB)</span>
          </h3>

          <div className="h-64 w-full">
            {positionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="position" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="profit_bb" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Positional data will appear after playing hands across different seats.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Common Mistakes & Position Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Strategic Leaks */}
        <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl shadow-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            <span>Top Identified Strategic Mistakes</span>
          </h3>

          {stats?.common_mistakes && stats.common_mistakes.length > 0 ? (
            <div className="space-y-2">
              {stats.common_mistakes.map((m, i) => (
                <div key={i} className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{m.description}</span>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono font-bold">
                    {m.count}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 p-4 bg-slate-900/30 rounded-2xl border border-slate-800">
              No major leaks identified yet! Keep playing solid GTO lines.
            </p>
          )}
        </div>

        {/* Detailed Position Breakdown Table */}
        <div className="bg-slate-950/90 border border-slate-800 p-5 rounded-3xl shadow-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Positional Metrics Table
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-2">Seat</th>
                  <th className="pb-2">Hands</th>
                  <th className="pb-2">VPIP</th>
                  <th className="pb-2">PFR</th>
                  <th className="pb-2">Net (BB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {Object.entries(stats?.position_stats || {}).map(([pos, data]) => (
                  <tr key={pos}>
                    <td className="py-2.5 font-sans font-bold text-amber-400">{pos}</td>
                    <td className="py-2.5 text-slate-300">{data.hands}</td>
                    <td className="py-2.5 text-slate-300">{data.vpip_pct}%</td>
                    <td className="py-2.5 text-slate-300">{data.pfr_pct}%</td>
                    <td className={`py-2.5 font-bold ${data.profit_bb >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {data.profit_bb > 0 ? `+${data.profit_bb}` : data.profit_bb}
                    </td>
                  </tr>
                ))}
                {Object.keys(stats?.position_stats || {}).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 font-sans">
                      No positional hands recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

