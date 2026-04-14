import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import CameraController from './CameraController';
import SunMesh from './SunMesh';
import PlanetMesh from './PlanetMesh';
import { solarSystemData } from '../../data/solarSystemData';

const SolarSystemScene: React.FC = () => {
  return (
    <Canvas 
      camera={{ fov: 45, far: 5000, position: [0, 100, 200] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#020205']} />
      
      {/* Global Illumination */}
      <ambientLight intensity={0.05} color={"#ffffff"} />
      
      {/* Background environment */}
      <Stars radius={300} depth={50} count={10000} factor={4} saturation={0} fade speed={1} />

      <Suspense fallback={null}>
        <CameraController />
        
        {/* Render celestial bodies */}
        {solarSystemData.map(planet => {
          if (planet.id === 'sun') {
            return <SunMesh key={planet.id} data={planet} />;
          }
          return <PlanetMesh key={planet.id} data={planet} />;
        })}

        {/* Post Processing for Sun's glow */}
        <EffectComposer disableNormalPass multisampling={4}>
          <Bloom 
            luminanceThreshold={0.5} 
            luminanceSmoothing={0.9} 
            intensity={1.5} 
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default SolarSystemScene;
