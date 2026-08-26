import React from 'react';
import { Play, Pause, Orbit, Type, Maximize, Film, Sparkles, Calendar, Grid, Sliders } from 'lucide-react';
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
    showAsteroids, 
    toggleAsteroids,
    showGravityGrid,
    toggleGravityGrid,
    gravityGridIntensity,
    setGravityGridIntensity,
    setSelectedPlanetId,
    isTourActive,
    startTour,
    stopTour,
    setDate,
    resetToToday,
    getSimulatedDate
  } = useSimulationStore();

  const currentDate = getSimulatedDate();
  const formattedDate = currentDate.toISOString().split('T')[0];

  return (
    <div className="bg-space-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-4 drop-shadow-2xl">
      {/* Header with Date & Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-white/90">
            {formattedDate}
          </span>
        </div>
        <button 
          onClick={() => { if (isTourActive) stopTour(); setSelectedPlanetId(null); }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
          title="Reset Camera View"
        >
          <Maximize size={15} className="text-white/60 group-hover:text-white" />
        </button>
      </div>

      {/* Date Epoch Quick Presets */}
      <div className="flex gap-1 justify-between">
        <button 
          onClick={() => setDate(new Date('1969-07-20T20:17:00Z'))}
          className="flex-1 text-[10px] py-1 bg-white/5 hover:bg-white/15 rounded transition-colors text-white/60 hover:text-cyan-300"
          title="Apollo 11 Moon Landing"
        >
          1969 Apollo
        </button>
        <button 
          onClick={resetToToday}
          className="flex-1 text-[10px] py-1 bg-cyan-500/15 hover:bg-cyan-500/25 rounded transition-colors text-cyan-300 font-semibold"
          title="Present Day"
        >
          2026 Today
        </button>
        <button 
          onClick={() => setDate(new Date('2061-07-28T00:00:00Z'))}
          className="flex-1 text-[10px] py-1 bg-white/5 hover:bg-white/15 rounded transition-colors text-white/60 hover:text-cyan-300"
          title="Halley Comet Next Perihelion"
        >
          2061 Halley
        </button>
      </div>

      {/* Speed & Playback */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/60">Speed</span>
          <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/90">
            {timeMultiplier <= 0.0001 ? 'Real Time' : `${timeMultiplier.toFixed(1)} Days/s`}
          </span>
        </div>
        
        <div className="flex gap-1 justify-between">
          <button onClick={() => setTimeMultiplier(1/86400)} className="flex-1 text-[10px] py-1 bg-white/5 hover:bg-white/20 rounded transition-colors text-white/60 hover:text-white">Real</button>
          <button onClick={() => setTimeMultiplier(1)} className="flex-1 text-[10px] py-1 bg-white/5 hover:bg-white/20 rounded transition-colors text-white/60 hover:text-white">1 D/s</button>
          <button onClick={() => setTimeMultiplier(30)} className="flex-1 text-[10px] py-1 bg-white/5 hover:bg-white/20 rounded transition-colors text-white/60 hover:text-white">1 M/s</button>
          <button onClick={() => setTimeMultiplier(100)} className="flex-1 text-[10px] py-1 bg-white/5 hover:bg-white/20 rounded transition-colors text-white/60 hover:text-white">Max</button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={togglePause}
            className="w-9 h-9 flex items-center justify-center shrink-0 rounded-full bg-white text-space-900 hover:bg-gray-200 transition-colors"
          >
            {isPaused ? <Play fill="currentColor" size={16} className="translate-x-0.5" /> : <Pause fill="currentColor" size={16} />}
          </button>
          
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="1"
            value={timeMultiplier <= 0.0001 ? 0 : timeMultiplier}
            onChange={(e) => setTimeMultiplier(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      <div className="h-px w-full bg-white/10" />

      {/* Layer Visibility Toggles */}
      <div className="grid grid-cols-5 gap-1.5">
        <button 
          onClick={toggleGravityGrid}
          className={`flex flex-col gap-1 items-center justify-center p-2 rounded-xl text-[10px] font-semibold transition-colors ${showGravityGrid ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40' : 'hover:bg-white/5 text-white/40'}`}
          title="Toggle Spacetime Gravity Fabric Grid"
        >
          <Grid size={13} /> Gravity
        </button>
        <button 
          onClick={toggleOrbits}
          className={`flex flex-col gap-1 items-center justify-center p-2 rounded-xl text-[10px] font-semibold transition-colors ${showOrbits ? 'bg-white/15 text-white' : 'hover:bg-white/5 text-white/40'}`}
          title="Toggle Orbit Lines"
        >
          <Orbit size={13} /> Orbits
        </button>
        <button 
          onClick={toggleLabels}
          className={`flex flex-col gap-1 items-center justify-center p-2 rounded-xl text-[10px] font-semibold transition-colors ${showLabels ? 'bg-white/15 text-white' : 'hover:bg-white/5 text-white/40'}`}
          title="Toggle Planet Labels"
        >
          <Type size={13} /> Labels
        </button>
        <button 
          onClick={toggleAsteroids}
          className={`flex flex-col gap-1 items-center justify-center p-2 rounded-xl text-[10px] font-semibold transition-colors ${showAsteroids ? 'bg-white/15 text-white' : 'hover:bg-white/5 text-white/40'}`}
          title="Toggle Asteroid Belt"
        >
          <Sparkles size={13} /> Belts
        </button>
        <button 
          onClick={() => isTourActive ? stopTour() : startTour()}
          className={`flex flex-col gap-1 items-center justify-center p-2 rounded-xl text-[10px] font-semibold transition-colors ${isTourActive ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-500/40' : 'hover:bg-white/5 text-white/40'}`}
          title="Start Cinematic Flythrough Tour"
        >
          <Film size={13} /> Tour
        </button>
      </div>

      {/* Gravity Well Depth Slider (shows when Gravity Grid is enabled) */}
      {showGravityGrid && (
        <div className="flex flex-col gap-1.5 pt-1 px-1 bg-white/[0.03] rounded-xl p-2 border border-white/5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-300/80 font-medium">
              <Sliders size={11} /> Spacetime Warp
            </span>
            <span className="font-mono text-white/80">{gravityGridIntensity.toFixed(1)}x</span>
          </div>
          <input 
            type="range" 
            min="0.2" 
            max="2.5" 
            step="0.1"
            value={gravityGridIntensity}
            onChange={(e) => setGravityGridIntensity(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
