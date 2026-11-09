import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { CardSelector } from '../common/CardSelector';
import { PlayingCard } from '../common/PlayingCard';
import { Search, Save, Play, Sparkles, Plus, Trash2, CheckCircle, Calculator, Award } from 'lucide-react';
import { CardData } from '../../types/poker';

export const HandAnalysisView: React.FC = () => {
  const [heroCards, setHeroCards] = useState<string[]>(['As', 'Ks']);
  const [boardCards, setBoardCards] = useState<string[]>(['8s', '7s', '2d']);
  const [tableSize, setTableSize] = useState<number>(6);
  const [position, setPosition] = useState<string>('BTN');
  const [stackSize, setStackSize] = useState<number>(2000);
  const [potSize, setPotSize] = useState<number>(150);
  const [callAmount, setCallAmount] = useState<number>(75);
  
  // Card selector modal state
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<'hero' | 'board'>('hero');
  const [selectorIndex, setSelectorIndex] = useState<number>(0);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);

  useEffect(() => {
    fetchSavedAnalyses();
  }, []);

  const fetchSavedAnalyses = async () => {
    try {
      const data = await api.getSavedAnalyses();
      setSavedAnalyses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSelector = (target: 'hero' | 'board', index: number) => {
    setSelectorTarget(target);
    setSelectorIndex(index);
    setSelectorOpen(true);
  };

  const handleSelectCard = (cardCode: string) => {
    if (selectorTarget === 'hero') {
      const newHero = [...heroCards];
      newHero[selectorIndex] = cardCode;
      setHeroCards(newHero);
    } else {
      const newBoard = [...boardCards];
      newBoard[selectorIndex] = cardCode;
      setBoardCards(newBoard);
    }
  };

  const handleAddBoardCard = () => {
    if (boardCards.length < 5) {
      setBoardCards([...boardCards, '2c']);
    }
  };

  const handleRemoveBoardCard = (index: number) => {
    setBoardCards(boardCards.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setSavedSuccess(false);
    try {
      const payload = {
        hero_cards: heroCards,
        board_cards: boardCards,
        table_size: tableSize,
        position,
        stack_size: stackSize,
        pot_size: potSize,
        call_amount: callAmount,
        action_history: callAmount > 0 ? ['bet'] : ['check']
      };
      const result = await api.evaluateHandAnalysis(payload);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult) return;
    try {
      await api.saveAnalysis({
        title: `${heroCards.join(' ')} from ${position} on ${boardCards.join(' ') || 'Preflop'}`,
        hero_cards: heroCards,
        board_cards: boardCards,
        position,
        pot_size: potSize,
        situation_details: `Facing bet of $${callAmount} into $${potSize}`,
        recommended_action: analysisResult.recommended_action,
        equity_pct: analysisResult.equity_pct,
        notes: analysisResult.feedback_reason
      });
      setSavedSuccess(true);
      fetchSavedAnalyses();
    } catch (err) {
      console.error(err);
    }
  };

  const allUsedCards = [...heroCards, ...boardCards];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Search className="text-amber-400" />
            <span>Interactive Hand Analyzer & EV Calculator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manually configure hole cards, board texture, pot size, and opponent action to receive mathematical EV and strategic recommendations.
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Play size={16} />
          <span>{loading ? 'Evaluating...' : 'Run Analysis'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Cards Configuration
            </h3>

            {/* Hero Hole Cards */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Hero Hole Cards</label>
              <div className="flex gap-2">
                {heroCards.map((code, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOpenSelector('hero', idx)}
                    className="flex-1 h-20 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 flex items-center justify-center font-mono font-black text-xl text-amber-300 transition-all hover:scale-105 shadow-md"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Board Cards */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-400">Board Cards (0 - 5)</label>
                {boardCards.length < 5 && (
                  <button
                    onClick={handleAddBoardCard}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Card
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {boardCards.map((code, idx) => (
                  <div key={idx} className="relative group">
                    <button
                      onClick={() => handleOpenSelector('board', idx)}
                      className="w-14 h-18 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 flex items-center justify-center font-mono font-black text-sm text-white transition-all shadow-md"
                    >
                      {code}
                    </button>
                    <button
                      onClick={() => handleRemoveBoardCard(idx)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {boardCards.length === 0 && (
                  <div className="text-xs text-slate-500 italic p-2">Preflop (no board cards)</div>
                )}
              </div>
            </div>

            {/* Parameters */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Situation Parameters
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none"
                  >
                    {['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Table Format</label>
                  <select
                    value={tableSize}
                    onChange={(e) => setTableSize(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none"
                  >
                    <option value={2}>Heads-Up (2)</option>
                    <option value={6}>6-Max</option>
                    <option value={9}>9-Max</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Pot Size ($)</label>
                  <input
                    type="number"
                    value={potSize}
                    onChange={(e) => setPotSize(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Bet to Call ($)</label>
                  <input
                    type="number"
                    value={callAmount}
                    onChange={(e) => setCallAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-4">
          {analysisResult ? (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
              {/* Top Recommendation Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recommended Action
                  </span>
                  <div className="text-2xl font-black text-emerald-400 capitalize mt-0.5 flex items-center gap-2">
                    <span>{analysisResult.recommended_action}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      EV: {analysisResult.call_ev >= 0 ? `+$${analysisResult.call_ev}` : `-$${Math.abs(analysisResult.call_ev)}`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSaveAnalysis}
                  disabled={savedSuccess}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Saved to History</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} className="text-amber-400" />
                      <span>Save Analysis</span>
                    </>
                  )}
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Made Hand</span>
                  <span className="font-bold text-white text-xs mt-1 block truncate">
                    {analysisResult.hand_evaluation?.description || 'Preflop'}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equity vs Range</span>
                  <span className="font-mono font-black text-emerald-400 text-lg mt-0.5 block">
                    {analysisResult.equity_pct}%
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pot Odds Required</span>
                  <span className="font-mono font-black text-amber-400 text-lg mt-0.5 block">
                    {analysisResult.pot_odds_pct}%
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pot Odds Ratio</span>
                  <span className="font-mono font-bold text-slate-200 text-xs mt-1 block">
                    {analysisResult.pot_odds_ratio}
                  </span>
                </div>
              </div>

              {/* Detailed Reasoning */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Strategic Reasoning
                </span>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  {analysisResult.feedback_reason}
                </p>
              </div>

              {/* Core Concept Takeaway */}
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
                <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
                    Strategic Concept
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {analysisResult.strategic_lesson}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-2">
              <Calculator size={40} className="mx-auto text-slate-600 mb-2" />
              <div className="font-bold text-slate-300">No Analysis Performed Yet</div>
              <p className="text-xs max-w-sm mx-auto">
                Select your hole cards, board cards, and parameters on the left, then click <strong>Run Analysis</strong> to calculate hand strength, equity, and pot odds.
              </p>
            </div>
          )}

          {/* Saved Hands Accordion / List */}
          {savedAnalyses.length > 0 && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Award size={16} className="text-amber-400" />
                <span>Saved Hand History ({savedAnalyses.length})</span>
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedAnalyses.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-200 block">{s.title}</span>
                      <span className="text-[11px] text-slate-400">Equity: {s.equity_pct}% • {s.recommended_action}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{s.timestamp?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Selector Modal */}
      <CardSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelectCard={handleSelectCard}
        usedCards={allUsedCards}
        title={selectorTarget === 'hero' ? `Select Hero Card ${selectorIndex + 1}` : `Select Board Card ${selectorIndex + 1}`}
      />
    </div>
  );
};

