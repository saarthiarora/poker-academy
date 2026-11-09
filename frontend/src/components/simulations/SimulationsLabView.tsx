import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { FlaskConical, Play, Award, CheckCircle, XCircle, Sparkles, RefreshCw, Layers } from 'lucide-react';

export const SimulationsLabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hand_vs_hand' | 'hand_vs_range' | 'decision_quiz'>('hand_vs_range');

  // Hand vs Hand state
  const [h1Cards, setH1Cards] = useState<string>('As Kh');
  const [h2Cards, setH2Cards] = useState<string>('Qc Qd');
  const [hvhResult, setHvhResult] = useState<any>(null);
  const [hvhLoading, setHvhLoading] = useState(false);

  // Hand vs Range state
  const [heroHand, setHeroHand] = useState<string>('As Ks');
  const [selectedRange, setSelectedRange] = useState<string>('top_10');
  const [hvrResult, setHvrResult] = useState<any>(null);
  const [hvrLoading, setHvrLoading] = useState(false);

  // Quiz state
  const [quizScenario, setQuizScenario] = useState<any>(null);
  const [quizFeedback, setQuizFeedback] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'decision_quiz' && !quizScenario) {
      loadNewQuiz();
    }
  }, [activeTab]);

  const runHandVsHand = async () => {
    setHvhLoading(true);
    try {
      const res = await api.simulateHandVsHand(
        h1Cards.split(' ').map(s => s.trim()).filter(Boolean),
        h2Cards.split(' ').map(s => s.trim()).filter(Boolean),
        [],
        5000
      );
      setHvhResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setHvhLoading(false);
    }
  };

  const runHandVsRange = async () => {
    setHvrLoading(true);
    try {
      const res = await api.simulateHandVsRange(
        heroHand.split(' ').map(s => s.trim()).filter(Boolean),
        selectedRange,
        [],
        5000
      );
      setHvrResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setHvrLoading(false);
    }
  };

  const loadNewQuiz = async () => {
    setQuizLoading(true);
    setQuizFeedback(null);
    try {
      const q = await api.getQuizScenario();
      setQuizScenario(q);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuizChoice = async (action: string) => {
    if (!quizScenario) return;
    try {
      const fb = await api.checkQuizAnswer(quizScenario.id, action);
      setQuizFeedback(fb);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <FlaskConical className="text-purple-400" />
            <span>Simulation Lab & Decision Trainer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Experiment with range vs range distributions, classic hand matchups, and test decision accuracy under pressure.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl text-xs font-bold text-slate-300">
          <button
            onClick={() => setActiveTab('hand_vs_range')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'hand_vs_range' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hand vs Range
          </button>
          <button
            onClick={() => setActiveTab('hand_vs_hand')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'hand_vs_hand' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hand vs Hand
          </button>
          <button
            onClick={() => setActiveTab('decision_quiz')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'decision_quiz' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Decision Drill Quiz
          </button>
        </div>
      </div>

      {/* Tab 1: Hand vs Range */}
      {activeTab === 'hand_vs_range' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Hero Hand (e.g. As Ks, Qh Qd, Jc Tc)
                </label>
                <input
                  type="text"
                  value={heroHand}
                  onChange={(e) => setHeroHand(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm font-mono font-bold text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Opponent Defined Range
                </label>
                <select
                  value={selectedRange}
                  onChange={(e) => setSelectedRange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-purple-500"
                >
                  <option value="top_5">Top 5% (AA, KK, QQ, AK)</option>
                  <option value="top_10">Top 10% (Tight Opening Range)</option>
                  <option value="top_20">Top 20% (Standard 6-Max Open)</option>
                  <option value="pocket_pairs">Pocket Pairs (AA - 22)</option>
                  <option value="broadways">All Broadway Hands</option>
                  <option value="suited_connectors">Suited Connectors (54s - AKs)</option>
                </select>
              </div>
            </div>

            <button
              onClick={runHandVsRange}
              disabled={hvrLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/40 active:scale-95 transition-all"
            >
              <Play size={16} />
              <span>{hvrLoading ? 'Sampling Combos...' : 'Simulate vs Range (5,000 runs)'}</span>
            </button>
          </div>

          {hvrResult && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-black text-white">Range Matchup Equity</h3>
                <span className="text-xs text-slate-400">
                  {hvrResult.combos_count} exact combo permutations analyzed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">Hero ({heroHand})</span>
                  <div className="font-mono font-black text-3xl text-emerald-400">
                    {hvrResult.hero.equity_pct}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Win: {hvrResult.hero.win_pct}% • Tie: {hvrResult.hero.tie_pct}%
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">Opponent Range ({selectedRange})</span>
                  <div className="font-mono font-black text-3xl text-amber-400">
                    {hvrResult.villain.equity_pct}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Win: {hvrResult.villain.win_pct}% • Tie: {hvrResult.villain.tie_pct}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Hand vs Hand */}
      {activeTab === 'hand_vs_hand' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Hand 1 (e.g. As Kh)</label>
                <input
                  type="text"
                  value={h1Cards}
                  onChange={(e) => setH1Cards(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm font-mono font-bold text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Hand 2 (e.g. Qc Qd)</label>
                <input
                  type="text"
                  value={h2Cards}
                  onChange={(e) => setH2Cards(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm font-mono font-bold text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              onClick={runHandVsHand}
              disabled={hvhLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/40 active:scale-95 transition-all"
            >
              <Play size={16} />
              <span>{hvhLoading ? 'Simulating Boards...' : 'Run Head-to-Head Simulation'}</span>
            </button>
          </div>

          {hvhResult && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-black text-white pb-3 border-b border-slate-800">
                Head-to-Head Result
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {hvhResult.results?.map((r: any, idx: number) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400">{r.label}</span>
                    <div className="font-mono font-black text-3xl text-emerald-400">
                      {r.equity_pct}%
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Win: {r.win_pct}% • Tie: {r.tie_pct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Decision Drill Quiz */}
      {activeTab === 'decision_quiz' && (
        <div className="space-y-6">
          {quizScenario ? (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Interactive Drill
                  </span>
                  <h3 className="text-lg font-black text-white">{quizScenario.title}</h3>
                </div>
                <button
                  onClick={loadNewQuiz}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  <RefreshCw size={14} />
                  <span>Next Drill</span>
                </button>
              </div>

              {/* Scenario details */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {quizScenario.position}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Street: {quizScenario.street}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                    Pot: ${quizScenario.pot_size}
                  </span>
                  <span className="text-slate-300">
                    Hero Cards: <strong className="text-amber-400">{quizScenario.hero_cards.join(' ')}</strong>
                  </span>
                  {quizScenario.board.length > 0 && (
                    <span className="text-slate-300">
                      Board: <strong className="text-emerald-400">{quizScenario.board.join(' ')}</strong>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {quizScenario.scenario}
                </p>
              </div>

              {/* Quiz Choices */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Select your action:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {quizScenario.options?.map((opt: any, i: number) => (
                    <button
                      key={i}
                      disabled={!!quizFeedback}
                      onClick={() => submitQuizChoice(opt.action)}
                      className="text-left p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:hover:scale-100"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz Feedback Result */}
              {quizFeedback && (
                <div className={`p-4 rounded-2xl border animate-in fade-in duration-200 ${
                  quizFeedback.is_correct
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-red-950/30 border-red-500/40 text-red-200'
                }`}>
                  <div className="flex items-center gap-2 font-black text-sm mb-1">
                    {quizFeedback.is_correct ? (
                      <>
                        <CheckCircle size={18} className="text-emerald-400" />
                        <span className="text-emerald-400">Correct Decision!</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} className="text-red-400" />
                        <span className="text-red-400">Suboptimal Move</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200">
                    {quizFeedback.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-500">
              Loading scenario drill...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

