import React, { useState } from 'react';
import { api } from '../../api/client';
import { GameState } from '../../types/poker';
import { Bot, Send, Sparkles, HelpCircle, CheckCircle, Lightbulb, MessageSquare, BookOpen } from 'lucide-react';
import { PlayingCard } from '../common/PlayingCard';

interface CoachViewProps {
  gameState: GameState | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  title?: string;
  type?: string;
  text: string;
  keyTakeaway?: string;
  timestamp: string;
}

const COMMON_QUESTIONS = [
  "How do I calculate pot odds?",
  "What is a continuation bet (c-bet)?",
  "Why is a hand playable from the Button but not UTG?",
  "What is the difference between GTO and exploitative play?",
  "How should I play suited connectors like 8♠ 7♠?",
  "When should I slowplay a monster hand?"
];

export const CoachView: React.FC<CoachViewProps> = ({ gameState }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'coach',
      title: 'Welcome to your AI Poker Tutor',
      type: 'academy_intro',
      text: "Hello! I am your personal poker strategy coach. You can ask me any theoretical question about pot odds, EV, GTO ranges, or how to play specific textures—or ask about your current live hand on the table.",
      keyTakeaway: "Mastering fundamental poker math and positional awareness is the foundation of high win-rate play.",
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const hero = gameState?.players[0];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const handContext = gameState ? {
        street: gameState.street,
        pot_total: gameState.pot_total,
        hole_cards: hero?.hole_cards.map(c => c.code) || [],
        community_cards: gameState.community_cards.map(c => c.code) || [],
        position: hero?.position || 'BTN',
        chips: hero?.chips || 2000
      } : undefined;

      const reply = await api.askCoach(query, handContext);

      const coachMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'coach',
        title: reply.title,
        type: reply.type,
        text: reply.explanation,
        keyTakeaway: reply.key_takeaway,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, coachMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'coach',
        text: "I couldn't process that question right now. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Bot size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>AI Poker Coach & Theory Tutor</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GTO & Exploitative
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive strategic mentor with live hand integration and deterministic probability engine.
            </p>
          </div>
        </div>

        {/* Live Hand Context Badge */}
        {hero && (
          <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Table:</span>
            <div className="flex items-center gap-1 font-bold text-slate-200">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">{hero.position}</span>
              <span>•</span>
              <span className="capitalize">{gameState?.street}</span>
              <span>•</span>
              <span className="text-emerald-400">${gameState?.pot_total} Pot</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Conversation Arena */}
        <div className="lg:col-span-2 bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[600px]">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'coach' && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                    <Bot size={18} />
                  </div>
                )}

                <div
                  className={`
                    max-w-xl rounded-2xl p-4 text-xs space-y-2 leading-relaxed shadow-lg
                    ${msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }
                  `}
                >
                  {msg.title && (
                    <div className="font-extrabold text-sm text-amber-300 pb-1 border-b border-slate-800 flex items-center justify-between">
                      <span>{msg.title}</span>
                      {msg.type && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {msg.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-line text-slate-200">
                    {msg.text}
                  </div>

                  {msg.keyTakeaway && (
                    <div className="bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl text-amber-200/90 flex items-start gap-2 mt-2">
                      <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300">Takeaway: </strong>
                        {msg.keyTakeaway}
                      </div>
                    </div>
                  )}

                  <div className={`text-[10px] text-right font-mono ${msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Bot size={16} className="animate-spin" />
                </div>
                <span>Analyzing situation and calculating strategic advice...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question about your hand, ranges, pot odds, or strategy..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputValue.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-all active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Quick Question Prompts & Hand Snapshot */}
        <div className="space-y-4">
          {/* Quick Questions Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>Recommended Topics</span>
            </h3>

            <div className="space-y-1.5">
              {COMMON_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{q}</span>
                  <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Table Context Inspector */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-400" />
              <span>Active Hand Context</span>
            </h3>

            {hero && hero.hole_cards.length > 0 ? (
              <div className="space-y-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Hero Hole Cards:</span>
                  <div className="flex gap-1">
                    {hero.hole_cards.map((c, i) => (
                      <PlayingCard key={i} card={c} size="xs" />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Position:</span>
                  <span className="font-mono font-bold text-amber-400">{hero.position}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Street:</span>
                  <span className="capitalize font-bold text-slate-200">{gameState?.street}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Pot:</span>
                  <span className="font-mono font-bold text-emerald-400">${gameState?.pot_total}</span>
                </div>

                {hero.hand_evaluation && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                    <strong>Made Hand: </strong>
                    <span className="text-amber-300">{hero.hand_evaluation.description}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                Start a hand on the Practice Table to inspect live positions and decisions here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

