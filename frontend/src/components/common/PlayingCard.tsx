import React from 'react';
import { CardData } from '../../types/poker';

interface PlayingCardProps {
  card?: CardData | null;
  faceDown?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isHighlighted?: boolean;
  className?: string;
  onClick?: () => void;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  size = 'md',
  isHighlighted = false,
  className = '',
  onClick
}) => {
  // Sizing dimensions: xs is now spacious enough (38x54) to never overflow
  const sizeClasses = {
    xs: 'w-[38px] h-[52px] text-xs rounded-md',
    sm: 'w-12 h-16 text-sm rounded-lg',
    md: 'w-16 h-22 text-base rounded-xl',
    lg: 'w-20 h-28 text-xl rounded-xl',
    xl: 'w-24 h-34 text-2xl rounded-2xl'
  };

  // Face-down card (Luxurious Bicycle / Bellagio gold-and-navy geometric back)
  if (faceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={`
          ${sizeClasses[size]}
          relative flex items-center justify-center
          bg-gradient-to-br from-[#121c33] via-[#0d1527] to-[#080d19]
          border-2 border-[#d4af37]/50 rounded-lg shadow-xl select-none
          overflow-hidden transition-all duration-200 hover:scale-105
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      >
        {/* Intricate Gold Diamond Lattice */}
        <div className="absolute inset-1 rounded border border-[#d4af37]/30 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:6px_6px] opacity-40 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border border-[#d4af37]/60 flex items-center justify-center bg-[#0d1527]/80">
            <span className="text-[#d4af37] text-[10px] font-serif font-black">♠</span>
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const suitColor = isRed ? 'text-rose-600' : 'text-slate-900';

  // For mini cards (xs), render clean compact format without overflowing corner elements
  if (size === 'xs') {
    return (
      <div
        onClick={onClick}
        className={`
          ${sizeClasses[size]}
          relative flex flex-col items-center justify-center p-1
          bg-gradient-to-b from-[#ffffff] via-[#fbfbfb] to-[#f0f0f2]
          border ${isHighlighted ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-amber-400/40' : 'border-slate-300'}
          shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5 select-none font-bold
          overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}
        `}
      >
        <div className={`flex flex-col items-center justify-center leading-none ${suitColor}`}>
          <span className="font-mono text-xs font-black tracking-tighter">{card.rank_char}</span>
          <span className="text-sm leading-none mt-0.5">{card.symbol}</span>
        </div>
      </div>
    );
  }

  // Full card (sm, md, lg, xl) with corners, watermark, and crisp shadows
  return (
    <div
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        relative flex flex-col justify-between p-1.5 md:p-2
        bg-gradient-to-b from-[#ffffff] via-[#fafafa] to-[#f3f4f6]
        border-2 ${isHighlighted ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-400/30' : 'border-slate-300/90'}
        shadow-lg hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 select-none font-bold
        overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}
      `}
    >
      {/* Top Left Corner */}
      <div className={`leading-none flex flex-col items-center self-start ${suitColor} z-10`}>
        <span className="font-mono tracking-tighter text-sm md:text-base font-black">{card.rank_char}</span>
        <span className="text-xs md:text-sm leading-none mt-0.5">{card.symbol}</span>
      </div>

      {/* Center Suit Watermark */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${suitColor} opacity-15`}>
        <span className={size === 'xl' ? 'text-6xl' : size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-4xl' : 'text-2xl'}>
          {card.symbol}
        </span>
      </div>

      {/* Bottom Right Inverted Corner */}
      <div className={`leading-none flex flex-col items-center self-end rotate-180 ${suitColor} z-10`}>
        <span className="font-mono tracking-tighter text-sm md:text-base font-black">{card.rank_char}</span>
        <span className="text-xs md:text-sm leading-none mt-0.5">{card.symbol}</span>
      </div>
    </div>
  );
};
