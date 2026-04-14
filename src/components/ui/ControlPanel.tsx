import React from 'react';
import { Play, Pause, Orbit, Type, Maximize } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

const ControlPanel: React.FC = () => {
  const { 
    timeMultiplier, 
    setTimeMultiplier, 
    isPaused, 
    togglePause,
    showOrbits,
    toggleOrbits,
    showLabels,
    toggleLabels,
    setSelectedPlanetId
  } = useSimulationStore();

  return (
    <div className="bg-space-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-5 drop-shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wider text-white/80 uppercase">Controls</h3>
        <button 
          onClick={() => setSelectedPlanetId(null)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
          title="Reset Camera View"
        >
          <Maximize size={16} className="text-white/60 group-hover:text-white" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/60">Time Speed</span>
          <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/90">
             {timeMultiplier.toFixed(1)} Days/s
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePause}
            className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-white text-space-900 hover:bg-gray-200 transition-colors"
          >
            {isPaused ? <Play fill="currentColor" size={18} className="translate-x-0.5" /> : <Pause fill="currentColor" size={18} />}
          </button>
          
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="1"
            value={timeMultiplier}
            onChange={(e) => setTimeMultiplier(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      <div className="h-px w-full bg-white/10" />

      <div className="flex items-center gap-2">
        <button 
          onClick={toggleOrbits}
          className={`flex-1 flex gap-2 items-center justify-center p-2 rounded-xl text-xs font-semibold transition-colors ${showOrbits ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
        >
          <Orbit size={14} /> Toggle Orbits
        </button>
        <button 
          onClick={toggleLabels}
          className={`flex-1 flex gap-2 items-center justify-center p-2 rounded-xl text-xs font-semibold transition-colors ${showLabels ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
        >
          <Type size={14} /> Toggle Labels
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
