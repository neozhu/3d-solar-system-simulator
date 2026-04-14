import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { solarSystemData } from '../../data/solarSystemData';
import { motion } from 'framer-motion';

const PlanetSelector: React.FC = () => {
  const selectedPlanetId = useSimulationStore(state => state.selectedPlanetId);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);

  return (
    <div className="bg-space-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 drop-shadow-2xl overflow-hidden flex gap-2 overflow-x-auto">
      {solarSystemData.map(planet => {
        const isSelected = selectedPlanetId === planet.id;
        return (
          <button
            key={planet.id}
            onClick={() => setSelectedPlanetId(planet.id)}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap group ${
              isSelected ? 'bg-white/10 text-white shadow-inner' : 'hover:bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            {isSelected && (
              <motion.div 
                layoutId="selector-highlight" 
                className="absolute inset-0 rounded-xl border border-white/20 select-none pointer-events-none" 
              />
            )}
            <div 
              className="w-3 h-3 rounded-full opacity-80 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
              style={{ 
                backgroundColor: planet.color,
                boxShadow: isSelected ? `0 0 10px ${planet.color}` : undefined
              }}
            />
            <span className="font-semibold tracking-wide text-sm">{planet.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PlanetSelector;
