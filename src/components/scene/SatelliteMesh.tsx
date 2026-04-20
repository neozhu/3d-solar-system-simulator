import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail, Line } from '@react-three/drei';
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
  
  const scaledRadius = getScaledRadius(data.radiusKm, data.id);
  const scaledDistance = getScaledSatelliteDistance(data.distanceFromSunAU);
  
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

  // Pre-calculate orbit path points for the faint static line
  const orbitPoints = useMemo(() => {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * scaledDistance, 0, Math.sin(theta) * scaledDistance));
    }
    return points;
  }, [scaledDistance]);

  useFrame(() => {
    const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
    
    // Orbital rotation
    if (orbitGroupRef.current) {
      orbitGroupRef.current.rotation.y = calculateOrbitalAngle(data.orbitalPeriodDays, timeElapsedDays);
    }
    
    // Self rotation
    if (meshRef.current) {
      // If the body is tidally locked (rotation == orbit), it should not have extra local rotation relative to its orbit arm.
      if (data.rotationPeriodDays === data.orbitalPeriodDays || data.isTidallyLocked) {
        meshRef.current.rotation.y = 0;
      } else {
        meshRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays, timeElapsedDays);
      }
    }
  });

  return (
    <group>
      {/* Static Orbit Line */}
      {showOrbits && scaledDistance > 0 && (
        <Line points={orbitPoints} color="#ffffff" transparent opacity={0.15} />
      )}
      
      {/* Satellite Group rotating around planet */}
      <group ref={orbitGroupRef}>
        
        {/* Dynamic Comet-like Trail */}
        {showOrbits && scaledDistance > 0 && (
          <Trail
            width={scaledRadius * 2}
            length={50} // shorter trail for moon
            color={new THREE.Color(data.color)}
            attenuation={(t) => t * t}
            target={meshRef as React.MutableRefObject<THREE.Object3D>}
          >
            <meshBasicMaterial opacity={0.3} transparent />
          </Trail>
        )}

        {/* Offset satellite by distance */}
        <group position={[scaledDistance, 0, 0]}>
          <group rotation={[0, 0, THREE.MathUtils.degToRad(data.axialTiltDegrees || 0)]}>
            <mesh ref={meshRef} name={data.id}>
              <sphereGeometry args={[scaledRadius, 32, 32]} />
              {colorMap ? (
                <meshBasicMaterial 
                  color="#ffffff"
                  map={colorMap || null}
                />
              ) : (
                <meshStandardMaterial 
                  color={data.color}
                  roughness={0.8}
                />
              )}
              
              {/* Layered Lighting for Day/Night Cycle on Texture */}
              {colorMap && (
                <mesh>
                  <sphereGeometry args={[scaledRadius, 32, 32]} />
                  <meshLambertMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.9}
                    blending={THREE.MultiplyBlending}
                    depthWrite={false}
                    polygonOffset={true}
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                  />
                </mesh>
              )}
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

export default SatelliteMesh;
