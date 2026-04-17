import { create } from 'zustand';

interface SimulationState {
  timeMultiplier: number;
  isPaused: boolean;
  selectedPlanetId: string | null;
  showOrbits: boolean;
  showLabels: boolean;
  
  setTimeMultiplier: (multiplier: number) => void;
  togglePause: () => void;
  setSelectedPlanetId: (id: string | null) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  
  // Real world time elapsed in simulation days
  globalTimeElapsedDays: number;
  incrementTime: (deltaTimeSeconds: number) => void;

  // Camera tour state
  isTourActive: boolean;
  startTour: () => void;
  stopTour: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  timeMultiplier: 10, // 1 real second = 10 days
  isPaused: false,
  selectedPlanetId: null,
  showOrbits: true,
  showLabels: true,
  
  globalTimeElapsedDays: 0,
  
  setTimeMultiplier: (multiplier) => set({ timeMultiplier: multiplier }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setSelectedPlanetId: (id) => set({ selectedPlanetId: id }),
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  
  incrementTime: (deltaTime) => set((state) => {
    if (state.isPaused) return state;
    return {
      globalTimeElapsedDays: state.globalTimeElapsedDays + (deltaTime * state.timeMultiplier)
    };
  }),

  // Camera tour
  isTourActive: false,
  startTour: () => set({ isTourActive: true }),
  stopTour: () => set({ isTourActive: false }),
}));
