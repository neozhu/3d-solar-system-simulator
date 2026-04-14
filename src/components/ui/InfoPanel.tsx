import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { solarSystemData } from '../../data/solarSystemData';

const InfoPanel: React.FC = () => {
  const selectedPlanetId = useSimulationStore(state => state.selectedPlanetId);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);
  
  const planet = solarSystemData.find(p => p.id === selectedPlanetId);

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
          
          <div className="p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-white tracking-tight">{planet.name}</h2>
              <button 
                onClick={() => setSelectedPlanetId(null)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-white/70 leading-relaxed font-medium">
              {planet.description}
            </p>
            
            <div className="flex flex-col gap-2 mt-2">
              <StatRow label="Radius" value={`${planet.radiusKm.toLocaleString()} km`} />
              {planet.distanceFromSunAU > 0 && (
                <StatRow label="Distance from Sun" value={`${planet.distanceFromSunAU} AU`} />
              )}
              <StatRow label="Orbital Period" value={`${planet.orbitalPeriodDays} days`} />
              <StatRow label="Rotation Period" value={`${planet.rotationPeriodDays} days`} />
              <StatRow label="Axial Tilt" value={`${planet.axialTiltDegrees}°`} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StatRow: React.FC<{label: string, value: string}> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="text-xs text-white/50">{label}</span>
    <span className="text-sm font-semibold text-white/90 font-mono text-right">{value}</span>
  </div>
);

export default InfoPanel;
