import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { RangeMatrixResponse, MatrixCell } from '../../types/poker';
import { Grid, ExternalLink, Info, Filter, Layers, CheckCircle } from 'lucide-react';

export const RangeChartView: React.FC = () => {
  const [tableFormat, setTableFormat] = useState('6max');
  const [position, setPosition] = useState('BTN');
  const [situation, setSituation] = useState('rfi');
  const [stackDepth, setStackDepth] = useState('100bb');
  const [matrixData, setMatrixData] = useState<RangeMatrixResponse | null>(null);
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);
  const [loading, setLoading] = useState(false);

  // Position options per format
  const positionsByFormat: Record<string, string[]> = {
    '6max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    '9max': ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
    'heads_up': ['BTN', 'BB']
  };

  useEffect(() => {
    // If current position not in format, reset to BTN
    if (!positionsByFormat[tableFormat]?.includes(position)) {
      setPosition(positionsByFormat[tableFormat][0]);
    }
  }, [tableFormat]);

  useEffect(() => {
    fetchMatrix();
  }, [tableFormat, position, situation, stackDepth]);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const data = await api.getRangeMatrix(tableFormat, position, situation, stackDepth);
      setMatrixData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const colorStyles: Record<string, string> = {
    green: 'bg-emerald-600/90 text-white border-emerald-500 hover:bg-emerald-500',
    blue: 'bg-blue-600/90 text-white border-blue-500 hover:bg-blue-500',
    orange: 'bg-amber-600/90 text-white border-amber-500 hover:bg-amber-500',
    purple: 'bg-purple-600/90 text-white border-purple-500 hover:bg-purple-500',
    grey: 'bg-slate-900/60 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Grid className="text-emerald-400" />
            <span>Starting Hand Strategy Matrix (13 × 13)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete 169-hand preflop strategy charts sourced from Upswing Poker, PokerCoaching, and PokerStars Learn.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-xs font-bold">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-600 text-white">Raise</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-600 text-white">Call</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-600 text-white">3-Bet</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-600 text-white">Mixed Freq</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-400">Fold</span>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
        {/* Table Format */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Table Format
          </label>
          <select
            value={tableFormat}
            onChange={(e) => setTableFormat(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
          >
            <option value="6max">6-Max (Standard)</option>
            <option value="9max">9-Max (Full Ring)</option>
            <option value="heads_up">Heads-Up (2-Player)</option>
          </select>
        </div>

        {/* Position */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Position
          </label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
          >
            {positionsByFormat[tableFormat]?.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Situation */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Situation
          </label>
          <select
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
          >
            <option value="rfi">Raise First In (RFI)</option>
            <option value="facing_open">Facing Open Raise</option>
            <option value="facing_3bet">Facing 3-Bet</option>
            <option value="facing_4bet">Facing 4-Bet</option>
            <option value="bb_defense">Big Blind Defense</option>
          </select>
        </div>

        {/* Stack Depth */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Stack Depth
          </label>
          <select
            value={stackDepth}
            onChange={(e) => setStackDepth(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
          >
            <option value="100bb">100 BB (Standard Cash)</option>
            <option value="60bb">60 BB</option>
            <option value="40bb">40 BB (Mid Stack)</option>
            <option value="20bb">20 BB (Short Stack)</option>
            <option value="150bb">150 BB (Deep Stack)</option>
          </select>
        </div>
      </div>

      {/* Main Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* The 13x13 Grid */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 p-4 rounded-3xl shadow-2xl relative">
          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-3xl">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-13 gap-1 md:gap-1.5 aspect-square max-w-2xl mx-auto">
            {matrixData?.matrix.map((row, rowIdx) =>
              row.map((cell) => {
                const isSelected = selectedCell?.hand === cell.hand;

                return (
                  <button
                    key={cell.hand}
                    onClick={() => setSelectedCell(cell)}
                    className={`
                      aspect-square rounded md:rounded-lg font-mono font-bold text-[10px] md:text-xs flex items-center justify-center border transition-transform
                      ${colorStyles[cell.color] || colorStyles.grey}
                      ${isSelected ? 'ring-2 ring-white scale-110 z-10 shadow-lg' : 'hover:scale-105'}
                    `}
                  >
                    {cell.hand}
                  </button>
                );
              })
            )}
          </div>

          {/* Grid Stats Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Range Coverage: <strong className="text-emerald-400">{matrixData?.estimated_range_pct}%</strong> of hands</span>
            <span>Pairs along diagonal • Suited above • Offsuit below</span>
          </div>
        </div>

        {/* Selected Hand Detail Drawer / Card */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          {selectedCell ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-black text-xl text-amber-400 shadow-inner">
                    {selectedCell.hand}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">
                      {selectedCell.type === 'pair' ? 'Pocket Pair' : selectedCell.type === 'suited' ? 'Suited Hand' : 'Offsuit Hand'}
                    </h3>
                    <span className="text-xs text-slate-400 capitalize">
                      {position} • {situation.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  selectedCell.action === 'raise' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  selectedCell.action === 'call' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  selectedCell.action === '3bet' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  selectedCell.action === 'mixed' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {selectedCell.action} ({selectedCell.frequency}%)
                </span>
              </div>

              {/* Strategic Explanation */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Strategic Recommendation
                </span>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  {selectedCell.reasoning}
                </p>
              </div>

              {/* Source Attribution */}
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Source & Educational Attribution
                </span>
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <span>{selectedCell.source?.name}</span>
                  <a
                    href={selectedCell.source?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
                  >
                    <span>View Chart</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  <strong>Assumptions: </strong>{selectedCell.source?.assumptions}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Info size={32} className="text-slate-600 mb-2" />
              <div className="font-bold text-slate-300">Select any hand cell in the matrix</div>
              <p className="text-xs max-w-xs">
                Click any cell (e.g. AA, AKs, 76s, T9o) to inspect its recommended action, frequency, and verified strategy breakdown.
              </p>
            </div>
          )}

          {/* Sources Footer */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 leading-snug">
            Ranges referenced from Upswing Poker (Doug Polk), Jonathan Little's PokerCoaching, and PokerStars Learn.
          </div>
        </div>
      </div>
    </div>
  );
};

