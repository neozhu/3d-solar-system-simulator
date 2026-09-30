import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius, getScaledSatelliteDistance, calculateRotationAngle } from '../../utils/scaling';
import { calculateKeplerianPosition, generateKeplerianOrbitPoints } from '../../utils/kepler';

interface SatelliteMeshProps {
  data: PlanetData;
  parent: PlanetData;
}

const SatelliteMesh: React.FC<SatelliteMeshProps> = ({ data, parent }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  
  const showOrbits = useSimulationStore(state => state.showOrbits);
  const showLabels = useSimulationStore(state => state.showLabels);
  const selectedPlanetId = useSimulationStore(state => state.selectedPlanetId);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);
  
  const isSelected = selectedPlanetId === data.id;
  const showLocalOrbit = showOrbits && (isSelected || selectedPlanetId === parent.id);

  const scaledRadius = Math.max(getScaledRadius(data.radiusKm, data.id), 0.25);
  const parentRadius = getScaledRadius(parent.radiusKm, parent.id);
  const scaleDistance = useMemo(() => (distanceAU: number) =>
    getScaledSatelliteDistance(distanceAU, parentRadius, parent.hasRings),
  [parentRadius, parent.hasRings]);
  const orbitalElements = useMemo(() => ({
    semiMajorAxisAU: data.distanceFromSunAU,
    eccentricity: data.eccentricity ?? 0,
    inclinationDeg: data.inclinationDeg ?? 0,
    longitudeOfAscendingNodeDeg: data.longitudeOfAscendingNodeDeg ?? 0,
    argumentOfPeriapsisDeg: data.argumentOfPeriapsisDeg ?? 0,
    orbitalPeriodDays: data.orbitalPeriodDays,
  }), [data]);
  
  const [colorMap, setColorMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    if (data.textureUrl) {
      loader.load(data.textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setColorMap(tex);
      });
    }
  }, [data.textureUrl]);

  // Orbit path points around the planet
  const orbitPoints = useMemo(() =>
    generateKeplerianOrbitPoints(orbitalElements, 96, scaleDistance),
  [orbitalElements, scaleDistance]);

  useFrame(() => {
    const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
    
    // Use the same local orbit calculation as the path and gravity grid.
    if (orbitGroupRef.current) {
      const position = calculateKeplerianPosition(orbitalElements, timeElapsedDays, scaleDistance);
      orbitGroupRef.current.position.copy(position);
      orbitGroupRef.current.rotation.y = -Math.atan2(position.z, position.x);
    }
    
    // Self rotation
    if (meshRef.current) {
      if (data.rotationPeriodDays === data.orbitalPeriodDays || data.isTidallyLocked) {
        meshRef.current.rotation.y = 0;
      } else {
        meshRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays, timeElapsedDays);
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedPlanetId(data.id);
  };

  return (
    <group>
      {/* Static Orbit Line around Parent Planet */}
      {showLocalOrbit && (
        <Line points={orbitPoints} color={data.color} transparent opacity={isSelected ? 0.5 : 0.2} lineWidth={isSelected ? 1.2 : 0.7} depthWrite={false} />
      )}
      
      {/* Satellite Group following its local orbit */}
      <group ref={orbitGroupRef}>
        
        <group>
          <group rotation={[0, 0, THREE.MathUtils.degToRad(data.axialTiltDegrees || 0)]}>
            <mesh 
              ref={meshRef} 
              name={data.id}
              onClick={handleClick}
              onPointerOver={() => document.body.style.cursor = 'pointer'}
              onPointerOut={() => document.body.style.cursor = 'default'}
            >
              <sphereGeometry args={[scaledRadius, 32, 32]} />
              {colorMap ? (
                <meshStandardMaterial 
                  map={colorMap}
                  roughness={0.8}
                />
              ) : (
                <meshStandardMaterial 
                  color={data.color}
                  roughness={0.85}
                  metalness={0.1}
                />
              )}

              {/* Selection highlight */}
              {isSelected && (
                <mesh>
                  <sphereGeometry args={[scaledRadius * 1.2, 16, 16]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={0.15} side={THREE.BackSide} />
                </mesh>
              )}
            </mesh>
          </group>

          {/* Label for Moons if selected or hovered */}
          {showLabels && isSelected && (
            <Html position={[0, -scaledRadius * 2.0, 0]} center zIndexRange={[100, 0]}>
              <div 
                className="text-xs font-semibold text-white/90 pointer-events-none"
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

export default SatelliteMesh;
