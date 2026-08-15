import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius, getScaledSatelliteDistance, calculateOrbitalAngle, calculateRotationAngle } from '../../utils/scaling';

interface SatelliteMeshProps {
  data: PlanetData;
}

const SatelliteMesh: React.FC<SatelliteMeshProps> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const orbitGroupRef = useRef<THREE.Group>(null);
  
  const showOrbits = useSimulationStore(state => state.showOrbits);
  const showLabels = useSimulationStore(state => state.showLabels);
  const selectedPlanetId = useSimulationStore(state => state.selectedPlanetId);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);
  
  const isSelected = selectedPlanetId === data.id;

  const scaledRadius = Math.max(getScaledRadius(data.radiusKm, data.id), 0.25);
  const scaledDistance = Math.max(getScaledSatelliteDistance(data.distanceFromSunAU), 2.2);
  
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
  const orbitPoints = useMemo(() => {
    const points = [];
    const segments = 64;
    const inc = THREE.MathUtils.degToRad(data.inclinationDeg ?? 0);
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * scaledDistance;
      const z = Math.sin(theta) * scaledDistance;
      const y = Math.sin(theta) * scaledDistance * Math.sin(inc);
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, [scaledDistance, data.inclinationDeg]);

  useFrame(() => {
    const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
    
    // Orbital rotation around parent planet
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = calculateOrbitalAngle(data.orbitalPeriodDays, timeElapsedDays);
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
      {showOrbits && (
        <Line points={orbitPoints} color="#ffffff" transparent opacity={0.12} lineWidth={1} />
      )}
      
      {/* Satellite Group rotating around planet */}
      <group ref={orbitGroupRef}>
        
        {/* Dynamic Comet-like Trail */}
        {showOrbits && (
          <Trail
            width={scaledRadius * 1.5}
            length={40}
            color={new THREE.Color(data.color)}
            attenuation={(t) => t * t}
            target={meshRef as React.MutableRefObject<THREE.Object3D>}
          >
            <meshBasicMaterial opacity={0.25} transparent />
          </Trail>
        )}

        {/* Offset satellite by distance */}
        <group position={[scaledDistance, 0, 0]}>
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
