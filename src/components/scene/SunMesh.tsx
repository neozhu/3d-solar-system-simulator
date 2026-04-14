import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Billboard } from '@react-three/drei';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius, calculateRotationAngle } from '../../utils/scaling';
import Atmosphere from './Atmosphere';

interface SunMeshProps {
  data: PlanetData;
}

const SunMesh: React.FC<SunMeshProps> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const scaledRadius = getScaledRadius(data.radiusKm, data.id);
  const showLabels = useSimulationStore(state => state.showLabels);
  const isSelected = useSimulationStore(state => state.selectedPlanetId === data.id);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);

  const [colorMap, setColorMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (data.textureUrl) {
      new THREE.TextureLoader().load(data.textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setColorMap(tex);
      });
    }
  }, [data.textureUrl]);

  useFrame((state) => {
    if (meshRef.current) {
      const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
      meshRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays, timeElapsedDays);
      meshRef.current.rotation.z = THREE.MathUtils.degToRad(data.axialTiltDegrees);
    }
    if (glowMaterial) {
      glowMaterial.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedPlanetId(data.id);
  };

  // Fake Optical Bloom Shader for the Sun
  const glowMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color1: { value: new THREE.Color("#ffffff") }, // Core hot white
      color2: { value: new THREE.Color("#ff8800") }, // Outer corona orange
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      uniform float time;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv - 0.5;
        float d = length(uv);
        
        // Animated angle/radius perturbations for heating effect
        float angle = atan(uv.y, uv.x);
        float wobble = sin(angle * 8.0 + time * 3.0) * 0.01 + sin(angle * 5.0 - time * 2.0) * 0.005;
        float animatedD = d + wobble;
        
        // Soft gradient fade to edges - tighter for a smaller halo
        float alpha = smoothstep(0.4, 0.22, animatedD);
        
        // Pulsating effect for the core
        float pulse = sin(time * 4.0) * 0.1 + 0.9; // pulse between 0.8 and 1.0
        
        // Mix hot core to orange outer smoothly
        vec3 color = mix(color2, color1, smoothstep(0.35, 0.1, d) * pulse);
        
        gl_FragColor = vec4(color, alpha * 0.9);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  return (
    <group>
      <mesh 
        ref={meshRef} 
        onClick={handleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
        name={data.id}
      >
        <sphereGeometry args={[scaledRadius, 64, 64]} />
        <meshBasicMaterial 
          color={colorMap ? '#ffffff' : data.color} 
          map={colorMap || null}
        />
        
        {/* Optical Glow Billboard (Replaces missing post-processing Bloom) */}
        <Billboard>
          <mesh material={glowMaterial}>
            <planeGeometry args={[scaledRadius * 4, scaledRadius * 4]} />
          </mesh>
        </Billboard>

        {/* Outer subtle corona ring */}
        <Atmosphere radius={scaledRadius * 1.02} color="#ff3300" />
        
        {/* Selection highlighting */}
        {isSelected && (
          <mesh>
            <sphereGeometry args={[scaledRadius * 1.05, 32, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
          </mesh>
        )}
      </mesh>
      
      {/* Light source for the rest of the solar system - increased intensity for textures */}
      <pointLight 
        color="#fff1e8" 
        intensity={3.5} 
        distance={2000} 
        decay={0.2} 
      />
      <ambientLight intensity={0.1} />
      
      {showLabels && (
        <Html position={[0, -scaledRadius * 1.2, 0]} center zIndexRange={[100, 0]}>
          <div 
            className={`text-sm tracking-wider font-semibold pointer-events-none transition-opacity duration-300 ${isSelected ? 'text-white opacity-100 drop-shadow-md' : 'text-white/60 opacity-100'}`}
            style={{ textShadow: '0px 0px 4px black' }}
          >
            {data.name}
          </div>
        </Html>
      )}
    </group>
  );
};

export default SunMesh;
