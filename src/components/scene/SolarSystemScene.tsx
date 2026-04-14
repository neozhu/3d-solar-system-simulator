import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

import CameraController from './CameraController';
import SunMesh from './SunMesh';
import PlanetMesh from './PlanetMesh';
import { solarSystemData } from '../../data/solarSystemData';

const SolarSystemScene: React.FC = () => {
  return (
    <Canvas 
      camera={{ fov: 45, far: 8000, position: [0, 150, 300] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={['#010103']} />
      
      {/* Background environment */}
      <Stars radius={400} depth={50} count={12000} factor={5} saturation={0} fade speed={1} />
      
      {/* Cosmic Dust / Ambient Space Particles for Parallax depth */}
      <Sparkles count={4000} scale={1500} size={1.5} speed={0.2} opacity={0.15} color="#c8d6e5" />

      <Suspense fallback={null}>
        <CameraController />
        
        {/* Render celestial bodies */}
        {solarSystemData.map(planet => {
          if (planet.id === 'sun') {
            return <SunMesh key={planet.id} data={planet} />;
          }
          return <PlanetMesh key={planet.id} data={planet} />;
        })}

        {/* Cinematic Post Processing (Temporarily Disabled for Debugging) */}
        {/* <EffectComposer disableNormalPass multisampling={4}>
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={1.2} 
            mipmapBlur
          />
          <ChromaticAberration 
            blendFunction={BlendFunction.NORMAL} 
            offset={new THREE.Vector2(0.0005, 0.0005)} 
          />
          <Noise 
            premultiply 
            blendFunction={BlendFunction.SCREEN} 
            opacity={0.3} 
          />
          <Vignette 
            offset={0.4} 
            darkness={0.6} 
            blendFunction={BlendFunction.NORMAL} 
          />
        </EffectComposer> */}
      </Suspense>
    </Canvas>
  );
};

export default SolarSystemScene;
