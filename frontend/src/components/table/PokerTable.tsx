import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerData } from '../../types/poker';
import { PlayingCard } from '../common/PlayingCard';
import { ActionControls } from './ActionControls';
import { CoachingDialog } from './CoachingDialog';
import { HandReviewModal } from './HandReviewModal';
import { OpponentModal } from './OpponentModal';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Coins,
  History,
  Award,
  Volume2,
  VolumeX,
  Sparkles,
  Bot
} from 'lucide-react';

interface PokerTableProps {
  gameState: GameState | null;
  onAction: (action: string, amount?: number) => void;
  onNextHand: () => void;
  coachingMode: boolean;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  gameState,
  onAction,
  onNextHand,
  coachingMode
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [inspectedPlayer, setInspectedPlayer] = useState<PlayerData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeBotTurn, setActiveBotTurn] = useState<string | null>(null);
  const [latestActions, setLatestActions] = useState<Record<string, { action: string; amount: number }>>({});
  const prevCommunityCount = useRef(0);

  // Play card sound whenever new community cards are dealt
  useEffect(() => {
    if (!gameState) return;
    const count = gameState.community_cards.length;
    if (count > prevCommunityCount.current) {
      sound.playCardDeal();
    }
    prevCommunityCount.current = count;
  }, [gameState?.community_cards.length]);

  // Check victory celebration
  useEffect(() => {
    if (!gameState) return;
    const isTerminal = gameState.street === 'showdown' || gameState.street === 'hand_ended';
    if (isTerminal) {
      const heroWon = (gameState.payouts?.['hero'] || 0) > 0;
      if (heroWon) {
        sound.playWinFanfare();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#06b6d4', '#10b981', '#f59e0b', '#fbbf24', '#ffffff']
          });
        } catch (e) {}
      }
    }
  }, [gameState?.street, gameState?.payouts]);

  // Stage AI turns with realistic pacing, speech bubbles, and specific action sounds
  const playStagedAiTurns = async (aiLogs: Array<{ player: string; action: string; amount: number; reason: string }>) => {
    for (const log of aiLogs) {
      setActiveBotTurn(log.player);
      setLatestActions(prev => ({
        ...prev,
        [log.player]: { action: log.action, amount: log.amount }
      }));

      // Play specific action sound for this bot
      if (log.action === 'check') {
        sound.playCheckThud();
      } else if (log.action === 'fold') {
        sound.playFoldSwish();
      } else {
        sound.playChipSound();
      }

      // 550ms human-like thinking delay per bot
      await new Promise(res => setTimeout(res, 550));
    }
    setActiveBotTurn(null);
  };

  const handleHeroAction = async (action: string, amount = 0) => {
    // Play hero's action sound immediately
    if (action === 'check') sound.playCheckThud();
    else if (action === 'fold') sound.playFoldSwish();
    else sound.playChipSound();

    // Trigger parent action
    onAction(action, amount);
  };

  // Whenever new ai_turn_logs arrive in gameState, animate them gracefully
  useEffect(() => {
    if (gameState?.ai_turn_logs && gameState.ai_turn_logs.length > 0) {
      playStagedAiTurns(gameState.ai_turn_logs);
    }
  }, [gameState?.ai_turn_logs]);

  if (!gameState) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#080b11]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-amber-500/20" />
          <p className="text-slate-300 font-bold tracking-wider text-sm uppercase">Entering High-Roller VIP Suite...</p>
        </div>
      </div>
    );
  }

  const {
    street,
    players,
    community_cards,
    pot_total,
    pots,
    current_player_idx,
    button_idx,
    legal_actions,
    action_history,
    coaching_feedback,
    hand_review
  } = gameState;

  const hero = players[0];
  const isHeroTurn = current_player_idx === 0 && street !== 'showdown' && street !== 'hand_ended' && !activeBotTurn;
  const isTerminal = street === 'showdown' || street === 'hand_ended';

  // Precision Seat Coordinates for Oval Geometry - Guaranteed Zero Collision with Pot
  const getSeatCoordinates = (index: number, total: number) => {
    if (total === 2) {
      return index === 0
        ? { left: '50%', top: '86%', transform: 'translate(-50%, -50%)' } // Hero (Bottom)
        : { left: '50%', top: '9%', transform: 'translate(-50%, -50%)' };  // Villain (Top)
    }
    if (total === 6) {
      const positions = [
        { left: '50%', top: '87%' }, // 0: Hero (Bottom Center)
        { left: '10%', top: '68%' }, // 1: Bottom Left
        { left: '14%', top: '16%' }, // 2: Top Left
        { left: '50%', top: '8%' },  // 3: Top Center (High above felt center!)
        { left: '86%', top: '16%' }, // 4: Top Right
        { left: '90%', top: '68%' }, // 5: Bottom Right
      ];
      return { ...positions[index], transform: 'translate(-50%, -50%)' };
    }
    // 9-Max Coordinates
    const positions9 = [
      { left: '50%', top: '88%' }, // 0: Hero
      { left: '22%', top: '82%' }, // 1: Bottom Left-Center
      { left: '8%',  top: '55%' }, // 2: Far Left Lower
      { left: '12%', top: '22%' }, // 3: Far Left Upper
      { left: '34%', top: '8%'  }, // 4: Top Left
      { left: '66%', top: '8%'  }, // 5: Top Right
      { left: '88%', top: '22%' }, // 6: Far Right Upper
      { left: '92%', top: '55%' }, // 7: Far Right Lower
      { left: '78%', top: '82%' }, // 8: Bottom Right-Center
    ];
    return { ...positions9[index % positions9.length], transform: 'translate(-50%, -50%)' };
  };

  const getLastActionForPlayer = (player: PlayerData) => {
    if (latestActions[player.name]) {
      return latestActions[player.name];
    }
    for (let i = action_history.length - 1; i >= 0; i--) {
      if (action_history[i].player_id === player.id) {
        return action_history[i];
      }
    }
    return null;
  };

  const toggleSound = () => {
    const newState = sound.toggleSound();
    setSoundEnabled(newState);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 md:p-6 overflow-hidden relative bg-[#070a0f]">
      {/* Top Header Bar inside Table Area */}
      <div className="flex items-center justify-between mb-2 z-30">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              {street}
            </span>
            <span className="text-xs text-slate-400 font-mono">| Hand #{gameState.hand_number}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300">
            <span className="text-slate-500 font-bold uppercase text-[10px]">Table:</span>
            <span className="font-extrabold text-white">
              {players.length === 2 ? 'Heads-Up (2)' : `${players.length}-Max Full Ring`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
            title={soundEnabled ? "Mute Casino Audio" : "Unmute Casino Audio"}
          >
            {soundEnabled ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} className="text-slate-500" />}
          </button>

          {/* Hand Review Trigger */}
          {hand_review && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-amber-900/30"
            >
              <Award size={15} />
              <span>Review Hand</span>
            </button>
          )}

          {/* Action Log Drawer Trigger */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors shadow-sm"
          >
            <History size={15} className="text-slate-400" />
            <span>{showHistory ? 'Hide Feed' : 'Hand Log'}</span>
          </button>
        </div>
      </div>

      {/* Main Luxury Poker Arena */}
      <div className="relative flex-1 flex items-center justify-center my-auto min-h-[500px] md:min-h-[560px]">
        {/* Ambient Top Spotlight Shading */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none" />

        {/* The VIP Table: Polished Walnut Rail with Brass Trim + Deep Emerald Velvet Felt */}
        <div
          className="relative w-full max-w-5xl h-[440px] md:h-[500px] rounded-[200px] border-[18px] border-[#1f140d] shadow-[inset_0_0_50px_rgba(0,0,0,0.9),0_25px_60px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center overflow-visible"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #0c4328 0%, #082d1c 55%, #051d12 85%, #03120b 100%)'
          }}
        >
          {/* Concentric Golden Felt Betting Boundary Line */}
          <div className="absolute inset-5 rounded-[170px] border border-[#d4af37]/20 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]" />

          {/* TABLE CENTER: Total Pot & Community Cards */}
          <div className="z-10 flex flex-col items-center gap-3 my-auto">
            {/* Total Pot Pill */}
            <div className="bg-[#0b1019]/90 border-2 border-[#d4af37]/60 px-5 py-1.5 rounded-full flex items-center gap-2.5 shadow-2xl backdrop-blur-md">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50">
                <Coins size={12} className="text-amber-400" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Total Pot:</span>
              <span className="font-mono font-black text-amber-300 text-lg tracking-tight">
                ${pot_total.toLocaleString()}
              </span>
            </div>

            {/* Side Pots if present */}
            {pots.length > 1 && (
              <div className="flex gap-2">
                {pots.map((pot, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-slate-700 text-slate-300 shadow"
                  >
                    {idx === 0 ? 'Main Pot' : `Side Pot ${idx}`}: ${pot.amount}
                  </span>
                ))}
              </div>
            )}

            {/* Community Cards Display with Staggered Flip Animation */}
            <div className="flex items-center gap-2 p-2.5 bg-[#090d14]/70 rounded-2xl border border-emerald-900/40 shadow-inner">
              {community_cards.length > 0 ? (
                community_cards.map((c, i) => (
                  <div
                    key={i}
                    className="animate-in fade-in zoom-in-90 duration-300"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <PlayingCard card={c} size="md" isHighlighted={true} />
                  </div>
                ))
              ) : (
                <div className="flex gap-2.5 opacity-40">
                  {['Flop', 'Flop', 'Flop', 'Turn', 'River'].map((streetLabel, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-22 rounded-xl border-2 border-dashed border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400/60"
                    >
                      {streetLabel}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PLAYERS AROUND THE TABLE */}
          {players.map((p, idx) => {
            const isTurn = (current_player_idx === idx && !isTerminal) || activeBotTurn === p.name;
            const isDealer = button_idx === idx;
            const coords = getSeatCoordinates(idx, players.length);
            const lastAct = getLastActionForPlayer(p);

            return (
              <div
                key={p.id}
                style={coords}
                className={`
                  absolute z-20 flex flex-col items-center select-none transition-all duration-300
                  ${p.folded ? 'opacity-35 grayscale-[60%]' : ''}
                `}
              >
                {/* Speech Bubble / Latest Action Tag */}
                {lastAct && !p.folded && (
                  <div className="mb-1.5 px-3 py-0.5 rounded-full bg-slate-950/95 border border-amber-500/50 text-[11px] font-black text-amber-300 shadow-xl animate-in zoom-in-95 duration-150">
                    <span className="capitalize">{lastAct.action}</span>
                    {lastAct.amount > 0 && <span className="ml-1 text-white">${lastAct.amount}</span>}
                  </div>
                )}

                {/* Unified Player Luxury Pod */}
                <div
                  onClick={() => !p.is_human && setInspectedPlayer(p)}
                  className={`
                    relative flex items-center gap-2.5 p-2 rounded-2xl border backdrop-blur-md shadow-2xl transition-all
                    ${p.is_human
                      ? 'bg-gradient-to-r from-slate-950 via-[#0d1627] to-slate-950 border-amber-400/70 min-w-[190px]'
                      : 'bg-gradient-to-r from-slate-950/90 to-[#0c121e]/90 border-slate-700/80 hover:border-slate-500 cursor-pointer min-w-[165px]'
                    }
                    ${isTurn ? 'glow-active-player border-amber-400 ring-4 ring-amber-400/50 scale-105' : ''}
                  `}
                >
                  {/* Avatar & Dealer Button */}
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                      {p.avatar}
                    </div>
                    {isDealer && (
                      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg border border-amber-100">
                        D
                      </div>
                    )}
                  </div>

                  {/* Player Name, Position, Chips */}
                  <div className="flex-1 leading-tight">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs text-white truncate max-w-[90px]">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {p.position}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono font-black text-emerald-400 flex items-center gap-1 mt-1">
                      <span>${p.chips.toLocaleString()}</span>
                      {p.is_all_in && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-600 text-white animate-pulse">
                          ALL-IN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Embedded Cards Inside/Adjacent to Pod - Zero Leaks! */}
                  <div className="flex gap-1 shrink-0">
                    {p.hole_cards.length > 0 ? (
                      p.hole_cards.map((c, i) => (
                        <PlayingCard
                          key={i}
                          card={c}
                          size="xs"
                          faceDown={!p.is_human && !p.show_cards && !isTerminal}
                        />
                      ))
                    ) : (
                      <>
                        <PlayingCard faceDown size="xs" />
                        <PlayingCard faceDown size="xs" />
                      </>
                    )}
                  </div>
                </div>

                {/* 3D Casino Chip Stack for Active Bets */}
                {p.current_bet > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950/90 border border-amber-400/80 text-amber-300 font-mono font-black text-xs shadow-lg">
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border border-white/40 shadow-sm" />
                    <span>${p.current_bet}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Hand Evaluation Banner */}
      {hero?.hand_evaluation && (
        <div className="mx-auto my-2 px-5 py-1.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 text-center shadow-xl flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Hand:</span>
          <span className="text-xs font-black text-amber-300">
            {hero.hand_evaluation.description}
          </span>
        </div>
      )}

      {/* Action Controls Deck */}
      <div className="mt-2">
        {isHeroTurn ? (
          <ActionControls
            legalActions={legal_actions}
            onAction={handleHeroAction}
            disabled={!isHeroTurn}
          />
        ) : isTerminal ? (
          <div className="max-w-md mx-auto p-4 bg-slate-950/95 border-2 border-amber-500/40 rounded-3xl text-center space-y-3 shadow-2xl backdrop-blur-md">
            <div className="text-base font-black text-white">Hand Concluded</div>
            <button
              onClick={() => {
                sound.playCardDeal();
                onNextHand();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-900/40 transition-all active:scale-95"
            >
              Deal Next Hand →
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>AI opponents are thinking...</span>
          </div>
        )}
      </div>

      {/* Live Action Feed Drawer */}
      {showHistory && (
        <div className="fixed top-20 right-6 w-80 max-h-[70vh] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl p-4 z-40 backdrop-blur-md flex flex-col animate-in slide-in-from-right-5 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <History size={15} className="text-amber-400" />
              <span>Live Action Log</span>
            </h4>
            <button
              onClick={() => setShowHistory(false)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 space-y-1.5 overflow-y-auto pr-1 flex-1 text-xs font-mono">
            {action_history.map((act, i) => (
              <div key={i} className="p-2 rounded-xl bg-slate-900/70 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300 font-bold">{act.player_name}:</span>
                <span className="text-amber-400 font-extrabold capitalize">
                  {act.action} {act.amount > 0 ? `$${act.amount}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chess.com Style Move Rating Banner & Commentary */}
      {coachingMode && coaching_feedback && (
        <CoachingDialog
          feedback={coaching_feedback}
          onClose={() => {}}
        />
      )}

      {/* Post-Hand Review Modal */}
      <HandReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        review={hand_review || null}
        heroCards={hero?.hole_cards}
        board={community_cards}
        onNextHand={onNextHand}
      />

      {/* Opponent Profile Inspector Modal */}
      <OpponentModal
        player={inspectedPlayer}
        onClose={() => setInspectedPlayer(null)}
      />
    </div>
  );
};
