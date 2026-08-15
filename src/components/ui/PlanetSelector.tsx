import React, { useState, useMemo } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { solarSystemData, PlanetData } from '../../data/solarSystemData';
import { motion } from 'framer-motion';

type FilterCategory = 'all' | 'planet' | 'moon' | 'dwarf_comet';

const PlanetSelector: React.FC = () => {
  const selectedPlanetId = useSimulationStore(state => state.selectedPlanetId);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);
  const [category, setCategory] = useState<FilterCategory>('all');

  // Flatten all selectable bodies including satellites
  const allSelectableBodies = useMemo(() => {
    const list: PlanetData[] = [];
    for (const body of solarSystemData) {
      list.push(body);
      if (body.satellites) {
        for (const sat of body.satellites) {
          list.push(sat);
        }
      }
    }
    return list;
  }, []);

  const filteredBodies = useMemo(() => {
    if (category === 'planet') {
      return allSelectableBodies.filter(b => b.category === 'planet' || b.id === 'sun');
    }
    if (category === 'moon') {
      return allSelectableBodies.filter(b => b.category === 'moon');
    }
    if (category === 'dwarf_comet') {
      return allSelectableBodies.filter(b => b.category === 'dwarf' || b.category === 'comet');
    }
    return allSelectableBodies;
  }, [allSelectableBodies, category]);

  return (
    <div className="bg-space-800/80 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 drop-shadow-2xl flex flex-col gap-2">
      {/* Category Tabs */}
      <div className="flex gap-1 border-b border-white/10 pb-1.5 px-1">
        <button
          onClick={() => setCategory('all')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            category === 'all' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setCategory('planet')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            category === 'planet' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'
          }`}
        >
          Planets
        </button>
        <button
          onClick={() => setCategory('moon')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            category === 'moon' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'
          }`}
        >
          Moons
        </button>
        <button
          onClick={() => setCategory('dwarf_comet')}
          className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
            category === 'dwarf_comet' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/80'
          }`}
        >
          Dwarf & Comets
        </button>
      </div>

      {/* Horizontal Scrollable Body List */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {filteredBodies.map(planet => {
          const isSelected = selectedPlanetId === planet.id;
          return (
            <button
              key={planet.id}
              onClick={() => setSelectedPlanetId(planet.id)}
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap group shrink-0 ${
                isSelected ? 'bg-white/15 text-white shadow-inner' : 'hover:bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {isSelected && (
                <motion.div 
                  layoutId="selector-highlight" 
                  className="absolute inset-0 rounded-xl border border-white/25 select-none pointer-events-none" 
                />
              )}
              <div 
                className="w-2.5 h-2.5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity shrink-0" 
                style={{ 
                  backgroundColor: planet.color,
                  boxShadow: isSelected ? `0 0 8px ${planet.color}` : undefined
                }}
              />
              <span className="font-semibold tracking-wide text-xs">{planet.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlanetSelector;
