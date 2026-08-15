import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { solarSystemData, PlanetData } from '../../data/solarSystemData';

const InfoPanel: React.FC = () => {
  const selectedPlanetId = useSimulationStore(state => state.selectedPlanetId);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);
  
  // Search body across all data including sub-satellites
  const planet = useMemo<PlanetData | undefined>(() => {
    if (!selectedPlanetId) return undefined;
    for (const body of solarSystemData) {
      if (body.id === selectedPlanetId) return body;
      if (body.satellites) {
        for (const sat of body.satellites) {
          if (sat.id === selectedPlanetId) return sat;
        }
      }
    }
    return undefined;
  }, [selectedPlanetId]);

  return (
    <AnimatePresence>
      {planet && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-80 bg-space-800/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden drop-shadow-2xl"
        >
          <div 
            className="h-2 rounded-t-2xl w-full" 
            style={{ backgroundColor: planet.color }}
          />
          
          <div className="p-5 flex flex-col gap-3.5 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{planet.name}</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                    {planet.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPlanetId(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-white/70 leading-relaxed font-medium">
              {planet.description}
            </p>
            
            <div className="flex flex-col gap-1.5 mt-1">
              <StatRow label="Mean Radius" value={`${planet.radiusKm.toLocaleString()} km`} />
              {planet.distanceFromSunAU > 0 && (
                <StatRow 
                  label={planet.category === 'moon' ? "Orbital Distance" : "Semi-Major Axis"} 
                  value={`${planet.distanceFromSunAU} AU`} 
                />
              )}
              {planet.eccentricity !== undefined && (
                <StatRow label="Eccentricity (e)" value={planet.eccentricity.toFixed(4)} />
              )}
              {planet.inclinationDeg !== undefined && (
                <StatRow label="Orbital Inclination" value={`${planet.inclinationDeg.toFixed(2)}°`} />
              )}
              <StatRow label="Orbital Period" value={`${planet.orbitalPeriodDays.toLocaleString()} days`} />
              <StatRow label="Rotation Period" value={`${planet.rotationPeriodDays} days`} />
              <StatRow label="Axial Tilt" value={`${planet.axialTiltDegrees}°`} />
              {planet.satellites && planet.satellites.length > 0 && (
                <StatRow label="Known Moons" value={`${planet.satellites.length} recorded`} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StatRow: React.FC<{label: string, value: string}> = ({ label, value }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
    <span className="text-xs text-white/50">{label}</span>
    <span className="text-xs font-semibold text-white/90 font-mono text-right">{value}</span>
  </div>
);

export default InfoPanel;
