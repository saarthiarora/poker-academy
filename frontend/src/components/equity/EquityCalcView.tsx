import React, { useState } from 'react';
import { api } from '../../api/client';
import { CardSelector } from '../common/CardSelector';
import { PlayingCard } from '../common/PlayingCard';
import { Calculator, Play, Plus, Trash2, Shuffle, CheckCircle, BarChart2 } from 'lucide-react';
import { EquityResponse, EquityResultPlayer } from '../../types/poker';

interface PlayerSlot {
  id: string;
  label: string;
  cards: string[]; // ["As", "Ks"] or [] for random
}

export const EquityCalcView: React.FC = () => {
  const [players, setPlayers] = useState<PlayerSlot[]>([
    { id: 'hero', label: 'Player 1 (Hero)', cards: ['As', 'Ks'] },
    { id: 'villain1', label: 'Player 2 (Villain)', cards: ['Qh', 'Qd'] }
  ]);
  const [board, setBoard] = useState<string[]>(['8s', '7c', '2s']);
  const [simulations, setSimulations] = useState<number>(10000);
  const [result, setResult] = useState<EquityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Selector modal state
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [targetType, setTargetType] = useState<'player' | 'board'>('player');
  const [targetPlayerIdx, setTargetPlayerIdx] = useState<number>(0);
  const [targetCardIdx, setTargetCardIdx] = useState<number>(0);

  const handleOpenSelector = (type: 'player' | 'board', pIdx: number, cIdx: number) => {
    setTargetType(type);
    setTargetPlayerIdx(pIdx);
    setTargetCardIdx(cIdx);
    setSelectorOpen(true);
  };

  const handleSelectCard = (cardCode: string) => {
    if (targetType === 'player') {
      const next = [...players];
      const curCards = [...next[targetPlayerIdx].cards];
      curCards[targetCardIdx] = cardCode;
      next[targetPlayerIdx].cards = curCards;
      setPlayers(next);
    } else {
      const nextBoard = [...board];
      nextBoard[targetCardIdx] = cardCode;
      setBoard(nextBoard);
    }
  };

  const handleAddPlayer = () => {
    if (players.length < 6) {
      setPlayers([
        ...players,
        { id: `p${players.length + 1}`, label: `Player ${players.length + 1}`, cards: [] }
      ]);
    }
  };

  const handleRemovePlayer = (idx: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== idx));
    }
  };

  const handleAddBoardCard = () => {
    if (board.length < 5) {
      setBoard([...board, 'Jh']);
    }
  };

  const handleRemoveBoardCard = (idx: number) => {
    setBoard(board.filter((_, i) => i !== idx));
  };

  const handleRunCalculation = async () => {
    setLoading(true);
    try {
      const payload = {
        players: players.map(p => ({
          id: p.id,
          label: p.label,
          cards: p.cards.filter(Boolean)
        })),
        board: board.filter(Boolean),
        num_simulations: simulations
      };
      const res = await api.calculateEquity(payload.players, payload.board, simulations);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Collect all assigned cards to prevent duplicate selection
  const usedCards = [
    ...players.flatMap(p => p.cards),
    ...board
  ].filter(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Calculator className="text-emerald-400" />
            <span>Monte Carlo Poker Equity Calculator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic Texas Hold'em equity simulator sampling up to 100,000 deck runouts with exact kicker tiebreakers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Simulations Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold text-slate-300">
            <span className="px-2 text-slate-500 uppercase text-[10px]">Sims:</span>
            {[1000, 10000, 100000].map(cnt => (
              <button
                key={cnt}
                onClick={() => setSimulations(cnt)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  simulations === cnt
                    ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cnt >= 1000 ? `${cnt / 1000}k` : cnt}
              </button>
            ))}
          </div>

          <button
            onClick={handleRunCalculation}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
          >
            <Play size={16} />
            <span>{loading ? 'Simulating...' : 'Calculate Equity'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup Column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Board Setup */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Community Cards ({board.length}/5)
              </h3>
              {board.length < 5 && (
                <button
                  onClick={handleAddBoardCard}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Card
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {board.map((card, idx) => (
                <div key={idx} className="relative group">
                  <button
                    onClick={() => handleOpenSelector('board', 0, idx)}
                    className="w-13 h-18 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-400 flex items-center justify-center font-mono font-black text-sm text-white transition-all shadow-md"
                  >
                    {card}
                  </button>
                  <button
                    onClick={() => handleRemoveBoardCard(idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {board.length === 0 && (
                <div className="text-xs text-slate-500 italic p-2">Preflop (no community cards)</div>
              )}
            </div>
          </div>

          {/* Players Setup */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Players ({players.length})
              </h3>
              {players.length < 6 && (
                <button
                  onClick={handleAddPlayer}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Opponent
                </button>
              )}
            </div>

            <div className="space-y-3">
              {players.map((p, pIdx) => (
                <div key={p.id} className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{p.label}</span>
                    {players.length > 2 && (
                      <button
                        onClick={() => handleRemovePlayer(pIdx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {[0, 1].map(cIdx => {
                      const card = p.cards[cIdx];
                      return (
                        <button
                          key={cIdx}
                          onClick={() => handleOpenSelector('player', pIdx, cIdx)}
                          className={`
                            flex-1 h-14 rounded-xl border flex items-center justify-center font-mono font-black text-sm transition-all
                            ${card
                              ? 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-400'
                              : 'bg-slate-950 border-dashed border-slate-700 text-slate-500 hover:border-slate-500'
                            }
                          `}
                        >
                          {card || 'Random'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white">Simulation Results</h3>
                  <span className="text-xs text-slate-400">
                    Sampled across {result.num_simulations.toLocaleString()} trials
                  </span>
                </div>
              </div>

              {/* Player Equity Bars */}
              <div className="space-y-4">
                {result.results.map((res, i) => (
                  <div key={res.player_id} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-white">{res.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          Win: <strong className="text-emerald-400">{res.win_pct}%</strong>
                        </span>
                        <span className="text-xs text-slate-400">
                          Tie: <strong className="text-amber-400">{res.tie_pct}%</strong>
                        </span>
                        <span className="font-mono font-black text-xl text-emerald-300">
                          {res.equity_pct}% Equity
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                      <div
                        style={{ width: `${res.win_pct}%` }}
                        className="bg-emerald-500 transition-all duration-500"
                      />
                      <div
                        style={{ width: `${res.tie_pct}%` }}
                        className="bg-amber-500 transition-all duration-500"
                      />
                    </div>

                    {/* Hand Breakdown Distribution */}
                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Made Hand Distribution
                      </span>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-[11px] font-mono">
                        {Object.entries(res.hand_types || {}).map(([cat, pct]) => (
                          <div key={cat} className="bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/80">
                            <span className="text-slate-400 block truncate">{cat}</span>
                            <span className="font-bold text-slate-200">{pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-2">
              <Calculator size={44} className="mx-auto text-slate-600 mb-2" />
              <div className="font-bold text-slate-300">Run an Equity Simulation</div>
              <p className="text-xs max-w-sm mx-auto">
                Configure your cards and opponents on the left, then click <strong>Calculate Equity</strong> to evaluate probabilities.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card Selector Modal */}
      <CardSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelectCard={handleSelectCard}
        usedCards={usedCards}
        title={targetType === 'player' ? `Assign ${players[targetPlayerIdx]?.label} Card` : 'Assign Board Card'}
      />
    </div>
  );
};

