import React from 'react';
import { CardData } from '../../types/poker';
import { X } from 'lucide-react';

interface CardSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (cardCode: string) => void;
  usedCards?: string[]; // e.g. ["As", "Kd"]
  title?: string;
}

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS = [
  { code: 's', symbol: '♠', name: 'Spades', isRed: false },
  { code: 'h', symbol: '♥', name: 'Hearts', isRed: true },
  { code: 'd', symbol: '♦', name: 'Diamonds', isRed: true },
  { code: 'c', symbol: '♣', name: 'Clubs', isRed: false },
];

export const CardSelector: React.FC<CardSelectorProps> = ({
  isOpen,
  onClose,
  onSelectCard,
  usedCards = [],
  title = 'Select a Card'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎴</span>
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 52 Cards Grid */}
        <div className="mt-4 space-y-3">
          {SUITS.map(suit => (
            <div key={suit.code} className="flex items-center gap-2">
              <div className={`w-8 font-serif text-2xl text-center font-bold ${suit.isRed ? 'text-red-500' : 'text-slate-300'}`}>
                {suit.symbol}
              </div>
              <div className="grid grid-cols-13 gap-1.5 flex-1">
                {RANKS.map(rank => {
                  const cardCode = `${rank}${suit.code}`;
                  const isUsed = usedCards.includes(cardCode);

                  return (
                    <button
                      key={cardCode}
                      disabled={isUsed}
                      onClick={() => {
                        onSelectCard(cardCode);
                        onClose();
                      }}
                      className={`
                        h-11 rounded-md flex flex-col items-center justify-center font-bold text-xs border transition-all
                        ${isUsed
                          ? 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-30 cursor-not-allowed'
                          : suit.isRed
                            ? 'bg-slate-800/90 border-slate-700 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:scale-105 active:scale-95'
                            : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:scale-105 active:scale-95'
                        }
                      `}
                    >
                      <span>{rank}</span>
                      <span className="text-[10px] leading-none opacity-80">{suit.symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Click any available card to assign it</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

