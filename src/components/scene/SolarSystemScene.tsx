import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

import CameraDirector from './CameraDirector';
import SunMesh from './SunMesh';
import PlanetMesh from './PlanetMesh';
import CometMesh from './CometMesh';
import AsteroidBelt from './AsteroidBelt';
import SpacetimeGrid from './SpacetimeGrid';
import SpaceBackground from './SpaceBackground';
import { solarSystemData } from '../../data/solarSystemData';

const SolarSystemScene: React.FC = () => {
  return (
    <Canvas 
      camera={{ fov: 60, far: 10000, position: [0, 400, 800] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#010103']} />
      
      {/* Procedural Deep Space Nebula Skybox */}
      <SpaceBackground />

      <Suspense fallback={null}>
        <CameraDirector />
        
        {/* Spacetime Gravitational Curvature & Potential Grid */}
        <SpacetimeGrid />

        {/* Render Asteroid Belt between Mars and Jupiter */}
        <AsteroidBelt />

        {/* Render celestial bodies */}
        {solarSystemData.map(body => {
          if (body.id === 'sun') {
            return <SunMesh key={body.id} data={body} />;
          }
          if (body.category === 'comet') {
            return <CometMesh key={body.id} data={body} />;
          }
          return <PlanetMesh key={body.id} data={body} />;
        })}

        {/* Cinematic Post Processing */}
        <EffectComposer enableNormalPass={false} multisampling={4}>
          <Bloom 
            luminanceThreshold={0.4} 
            luminanceSmoothing={0.8} 
            intensity={0.7} 
            mipmapBlur
          />
          <Noise 
            premultiply 
            blendFunction={BlendFunction.SCREEN} 
            opacity={0.06} 
          />
          <Vignette 
            offset={0.35} 
            darkness={0.45} 
            blendFunction={BlendFunction.NORMAL} 
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default SolarSystemScene;
