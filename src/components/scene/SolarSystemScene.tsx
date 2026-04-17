import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

import CameraDirector from './CameraDirector';
import SunMesh from './SunMesh';
import PlanetMesh from './PlanetMesh';
import SpaceBackground from './SpaceBackground';
import { solarSystemData } from '../../data/solarSystemData';

const SolarSystemScene: React.FC = () => {
  return (
    <Canvas 
      camera={{ fov: 60, far: 8000, position: [0, 400, 800] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#010103']} />
      
      {/* Procedural Deep Space Nebula Skybox */}
      <SpaceBackground />

      <Suspense fallback={null}>
        <CameraDirector />
        
        {/* Render celestial bodies */}
        {solarSystemData.map(planet => {
          if (planet.id === 'sun') {
            return <SunMesh key={planet.id} data={planet} />;
          }
          return <PlanetMesh key={planet.id} data={planet} />;
        })}

        {/* Cinematic Post Processing — subtle, realistic */}
        <EffectComposer enableNormalPass={false} multisampling={4}>
          <Bloom 
            luminanceThreshold={0.3} 
            luminanceSmoothing={0.9} 
            intensity={0.8} 
            mipmapBlur
          />
          <Noise 
            premultiply 
            blendFunction={BlendFunction.SCREEN} 
            opacity={0.08} 
          />
          <Vignette 
            offset={0.35} 
            darkness={0.5} 
            blendFunction={BlendFunction.NORMAL} 
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default SolarSystemScene;
