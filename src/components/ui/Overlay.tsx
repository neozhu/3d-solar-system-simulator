import React from 'react';
import PlanetSelector from './PlanetSelector';
import ControlPanel from './ControlPanel';
import InfoPanel from './InfoPanel';

const Overlay: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Solar System
          </h1>
          <p className="text-white/60 text-sm font-medium">Interactive 3D Simulator</p>
        </div>
        
        <div className="pointer-events-auto">
           <InfoPanel />
        </div>
      </div>
      
      <div className="flex justify-between items-end gap-6 pointer-events-auto">
        <div className="flex-1 max-w-4xl">
          <PlanetSelector />
        </div>
        
        <div className="w-80">
          <ControlPanel />
        </div>
      </div>
    </div>
  );
};

export default Overlay;
