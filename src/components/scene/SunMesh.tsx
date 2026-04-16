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
      
      // Simple hash to get pseudo-random noise
      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      
      void main() {
        vec2 uv = vUv - 0.5;
        float d = length(uv);
        float angle = atan(uv.y, uv.x);
        
        // Create multiple dynamic "layers" of solar flares using overlapping frequencies
        float flare1 = sin(angle * 12.0 + time * 1.5) * 0.5 + 0.5;
        float flare2 = sin(angle * 22.0 - time * 1.1) * 0.5 + 0.5;
        float flare3 = sin(angle * 8.0 + time * 0.7) * 0.5 + 0.5;
        
        // Composite flares
        float flares = (flare1 * flare2 * flare3);
        
        // Base edge wobble for the plasma ring
        float wobble = sin(angle * 5.0 - time * 2.0) * 0.01 + flares * 0.02;
        float animatedD = d + wobble;
        
        // 1. The Core Corona (bright ring just outside the sun surface)
        // Sun radius is exactly at d=0.25 on this plane.
        float coronaRing = smoothstep(0.35, 0.24, animatedD) * smoothstep(0.23, 0.25, d);
        
        // 2. The Spiking Flares (shoot out further into space)
        // High intensity flares that extend bounds and fade out
        float flareSpikes = flares * smoothstep(0.24, 0.45, d) * smoothstep(0.45, 0.24, d) * 1.5;
        
        // Combine opacities and boost heavily
        float alpha = clamp(coronaRing + flareSpikes, 0.0, 1.0);
        
        // Dynamic pulsate
        float pulse = sin(time * 3.0) * 0.08 + 0.92;
        
        // Rich cinematic coloring
        // The innermost edge is blazing white/yellow, fading out to deep bloody orange and then dark red
        vec3 deepRed = vec3(0.6, 0.05, 0.0);
        vec3 c = mix(deepRed, color2, smoothstep(0.38, 0.30, d)); // Deep red to orange
        c = mix(c, color1, smoothstep(0.30, 0.24, d) * pulse);    // Orange to hot white
        
        gl_FragColor = vec4(c, alpha * 0.95);
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
          key={colorMap ? 'textured' : 'fallback'}
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
