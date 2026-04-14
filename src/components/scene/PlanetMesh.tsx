import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius, getScaledDistance, calculateOrbitalAngle, calculateRotationAngle } from '../../utils/scaling';

interface PlanetMeshProps {
  data: PlanetData;
}

const PlanetMesh: React.FC<PlanetMeshProps> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  
  const showLabels = useSimulationStore(state => state.showLabels);
  const showOrbits = useSimulationStore(state => state.showOrbits);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);
  
  const scaledRadius = getScaledRadius(data.radiusKm, data.id);
  const scaledDistance = getScaledDistance(data.distanceFromSunAU);
  
  const isSelected = useSimulationStore(state => state.selectedPlanetId === data.id);

  // Pre-calculate orbit path points for the line
  const orbitPoints = useMemo(() => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * scaledDistance, 0, Math.sin(theta) * scaledDistance));
    }
    return points;
  }, [scaledDistance]);

  const orbitPathGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(orbitPoints);
  }, [orbitPoints]);

  useFrame(() => {
    const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
    
    // Orbital rotation
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = calculateOrbitalAngle(data.orbitalPeriodDays, timeElapsedDays);
    }
    
    // Self rotation (planet only, not the tilted system)
    if (meshRef.current) {
      meshRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays, timeElapsedDays);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedPlanetId(data.id);
  };

  return (
    <group>
      {/* Orbit Line */}
      {showOrbits && scaledDistance > 0 && (
        <line geometry={orbitPathGeometry}>
          <lineBasicMaterial attach="material" color="#ffffff" transparent opacity={0.15} />
        </line>
      )}
      
      {/* Planet Group rotating around sun */}
      <group ref={orbitGroupRef}>
        {/* Offset planet by distance */}
        <group position={[scaledDistance, 0, 0]}>
          
          {/* Tilted system group (holds planet and rings on the same tilted axis) */}
          <group rotation={[0, 0, THREE.MathUtils.degToRad(data.axialTiltDegrees)]}>
            
            {/* The Planet itself - spins on its local Y axis */}
            <mesh 
              ref={meshRef} 
              onClick={handleClick}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'default'}
              name={data.id}
            >
              <sphereGeometry args={[scaledRadius, 64, 64]} />
              <meshStandardMaterial 
                color={data.color} 
                roughness={0.7}
                metalness={0.1}
              />
              
              {/* Selection highlight */}
              {isSelected && (
                <mesh>
                  <sphereGeometry args={[scaledRadius * 1.1, 32, 32]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
                </mesh>
              )}
            </mesh>

            {/* Saturn's Rings - Decoupled from the planet's rapid Y-spin to avoid aliasing artifacts */}
            {data.hasRings && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[scaledRadius * 1.4, scaledRadius * 2.2, 64]} />
                <meshBasicMaterial color={data.color} transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>

          {/* HTML Label */}
          {showLabels && (
            <Html position={[0, -scaledRadius * 1.5, 0]} center zIndexRange={[100, 0]}>
              <div 
                className={`text-sm tracking-wider font-semibold pointer-events-none transition-opacity duration-300 ${isSelected ? 'text-white opacity-100 drop-shadow-md' : 'text-white/60 opacity-100 hover:opacity-100'}`}
                style={{ textShadow: '0px 0px 4px black' }}
              >
                {data.name}
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
};

export default PlanetMesh;
