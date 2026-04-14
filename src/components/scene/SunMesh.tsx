import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius, calculateRotationAngle } from '../../utils/scaling';

interface SunMeshProps {
  data: PlanetData;
}

const SunMesh: React.FC<SunMeshProps> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const scaledRadius = getScaledRadius(data.radiusKm, data.id);
  const showLabels = useSimulationStore(state => state.showLabels);
  const isSelected = useSimulationStore(state => state.selectedPlanetId === data.id);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);

  useFrame(() => {
    if (meshRef.current) {
      const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
      meshRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays, timeElapsedDays);
      meshRef.current.rotation.z = THREE.MathUtils.degToRad(data.axialTiltDegrees);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedPlanetId(data.id);
  };

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
        {/* Use meshBasicMaterial so it acts as an emitter (emissive material wouldn't glow as well without extra light logic) */}
        <meshBasicMaterial color={data.color} />
        
        {/* Selection highlighting */}
        {isSelected && (
          <mesh>
            <sphereGeometry args={[scaledRadius * 1.05, 32, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
          </mesh>
        )}
      </mesh>
      
      {/* Light source for the rest of the solar system */}
      <pointLight 
        color="#fff1e8" 
        intensity={2.5} 
        distance={2000} 
        decay={0.5} 
      />
      
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
