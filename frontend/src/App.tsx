import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import { GameState, OverallStats } from './types/poker';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { PokerTable } from './components/table/PokerTable';
import { CoachView } from './components/coach/CoachView';
import { RangeChartView } from './components/charts/RangeChartView';
import { HandAnalysisView } from './components/analysis/HandAnalysisView';
import { EquityCalcView } from './components/equity/EquityCalcView';
import { SimulationsLabView } from './components/simulations/SimulationsLabView';
import { StatisticsView } from './components/stats/StatisticsView';

export const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [coachingMode, setCoachingMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial game state & statistics
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const state = await api.getGameState();
      setGameState(state);
      const st = await api.getStatistics();
      setStats(st);
    } catch (err) {
      console.warn("Could not get initial state, attempting to start new game...", err);
      try {
        const state = await api.startNewGame(6, 2000);
        setGameState(state);
      } catch (e) {
        console.error("Failed to initialize game:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTableSizeChange = async (size: number) => {
    try {
      const state = await api.setTableSize(size);
      setGameState(state);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextHand = async () => {
    try {
      const state = await api.nextHand();
      setGameState(state);
      const st = await api.getStatistics();
      setStats(st);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (action: string, amount = 0) => {
    try {
      const state = await api.executeAction(action, amount, coachingMode);
      setGameState(state);
      if (state.street === 'hand_ended' || state.street === 'showdown') {
        const st = await api.getStatistics();
        setStats(st);
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#080b11] text-slate-100 overflow-hidden font-sans">
      {/* Persistent Sidebar (Sections 1 through 8) */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        coachingMode={coachingMode}
        onToggleCoachingMode={() => setCoachingMode(!coachingMode)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <TopNav
          gameState={gameState}
          onTableSizeChange={handleTableSizeChange}
          onNextHand={handleNextHand}
          coachingMode={coachingMode}
          onToggleCoachingMode={() => setCoachingMode(!coachingMode)}
        />

        <main className="flex-1 flex flex-col">
          {currentSection === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentSection}
              stats={stats}
            />
          )}

          {currentSection === 'practice' && (
            <PokerTable
              gameState={gameState}
              onAction={handleAction}
              onNextHand={handleNextHand}
              coachingMode={coachingMode}
            />
          )}

          {currentSection === 'coach' && (
            <CoachView gameState={gameState} />
          )}

          {currentSection === 'ranges' && (
            <RangeChartView />
          )}

          {currentSection === 'analysis' && (
            <HandAnalysisView />
          )}

          {currentSection === 'equity' && (
            <EquityCalcView />
          )}

          {currentSection === 'simulations' && (
            <SimulationsLabView />
          )}

          {currentSection === 'stats' && (
            <StatisticsView />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
