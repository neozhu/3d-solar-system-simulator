import { create } from 'zustand';

// Baseline reference date: 2026-08-15
const BASE_DATE_TIMESTAMP = new Date('2026-08-15T00:00:00Z').getTime();
const MILLISECONDS_PER_DAY = 86400 * 1000;

interface SimulationState {
  timeMultiplier: number;
  isPaused: boolean;
  selectedPlanetId: string | null;
  showOrbits: boolean;
  showLabels: boolean;
  showAsteroids: boolean;
  
  setTimeMultiplier: (multiplier: number) => void;
  togglePause: () => void;
  setSelectedPlanetId: (id: string | null) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  toggleAsteroids: () => void;
  
  // Real world time elapsed in simulation days
  globalTimeElapsedDays: number;
  incrementTime: (deltaTimeSeconds: number) => void;
  setDate: (targetDate: Date) => void;
  resetToToday: () => void;

  // Camera tour state
  isTourActive: boolean;
  startTour: () => void;
  stopTour: () => void;

  // Computed Date string helper
  getSimulatedDate: () => Date;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  timeMultiplier: 10, // 1 real second = 10 days
  isPaused: false,
  selectedPlanetId: null,
  showOrbits: true,
  showLabels: true,
  showAsteroids: true,
  
  globalTimeElapsedDays: 0,
  
  setTimeMultiplier: (multiplier) => set({ timeMultiplier: multiplier }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSelectedPlanetId: (id) => set({ selectedPlanetId: id }),
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleAsteroids: () => set((state) => ({ showAsteroids: !state.showAsteroids })),
  
  incrementTime: (deltaTime) => set((state) => {
    if (state.isPaused) return state;
    return {
      globalTimeElapsedDays: state.globalTimeElapsedDays + (deltaTime * state.timeMultiplier)
    };
  }),

  setDate: (targetDate: Date) => {
    const diffMs = targetDate.getTime() - BASE_DATE_TIMESTAMP;
    const days = diffMs / MILLISECONDS_PER_DAY;
    set({ globalTimeElapsedDays: days });
  },

  resetToToday: () => {
    set({ globalTimeElapsedDays: 0 });
  },

  getSimulatedDate: () => {
    const elapsedDays = get().globalTimeElapsedDays;
    return new Date(BASE_DATE_TIMESTAMP + elapsedDays * MILLISECONDS_PER_DAY);
  },

  // Camera tour
  isTourActive: false,
  startTour: () => set({ isTourActive: true }),
  stopTour: () => set({ isTourActive: false }),
}));
