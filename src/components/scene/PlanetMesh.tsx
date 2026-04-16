import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Trail, Line } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius, getScaledDistance, calculateOrbitalAngle, calculateRotationAngle } from '../../utils/scaling';
import Atmosphere from './Atmosphere';

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

  const [colorMap, setColorMap] = useState<THREE.Texture | null>(null);
  const [ringMap, setRingMap] = useState<THREE.Texture | null>(null);
  const [bumpMap, setBumpMap] = useState<THREE.Texture | null>(null);
  const [specularMap, setSpecularMap] = useState<THREE.Texture | null>(null);
  const [cloudsMap, setCloudsMap] = useState<THREE.Texture | null>(null);
  const useTexturedSurface = !!colorMap;
  const useLayeredLighting = data.id !== 'sun' && !!colorMap;
  const useLayeredRings = data.id === 'saturn' && !!ringMap;

  // Cloud rotation ref
  const cloudsRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    if (data.textureUrl) {
      loader.load(data.textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setColorMap(tex);
      });
    }
    if (data.bumpMapUrl) {
      loader.load(data.bumpMapUrl, (tex) => setBumpMap(tex));
    }
    if (data.specularMapUrl) {
      loader.load(data.specularMapUrl, (tex) => setSpecularMap(tex));
    }
    if (data.cloudsMapUrl) {
      loader.load(data.cloudsMapUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setCloudsMap(tex);
      });
    }
    if (data.hasRings && data.ringTextureUrl) {
      loader.load(data.ringTextureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setRingMap(tex);
      });
    }
  }, [data.textureUrl, data.ringTextureUrl, data.bumpMapUrl, data.specularMapUrl, data.cloudsMapUrl, data.hasRings]);

  // Pre-calculate orbit path points for the faint static line
  const orbitPoints = useMemo(() => {
    const points = [];
    const segments = 128;
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
    
    // Self rotation (planet only, not the tilted system)
    if (meshRef.current) {
      meshRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays, timeElapsedDays);
    }
    
    // Cloud layer rotates slightly faster than the planet
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays * 0.85, timeElapsedDays);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedPlanetId(data.id);
  };

  return (
    <group>
      {/* Static Orbit Line */}
      {showOrbits && scaledDistance > 0 && (
        <Line points={orbitPoints} color="#ffffff" transparent opacity={0.05} />
      )}
      
      {/* Planet Group rotating around sun */}
      <group ref={orbitGroupRef}>
        
        {/* Dynamic Comet-like Trail */}
        {showOrbits && scaledDistance > 0 && (
          <Trail
            width={scaledRadius * 3}
            length={150} // length of the trail
            color={new THREE.Color(data.color)}
            attenuation={(t) => t * t}
            target={meshRef as React.MutableRefObject<THREE.Object3D>}
          >
            <meshBasicMaterial opacity={0.3} transparent />
          </Trail>
        )}

        {/* Offset planet by distance */}
        <group position={[scaledDistance, 0, 0]}>
          
          {/* Tilted system group (holds planet and rings on the same tilted axis) */}
          <group rotation={[0, 0, THREE.MathUtils.degToRad(data.axialTiltDegrees)]}>
            
            {/* The Planet itself - spins on its local Y axis */}
            <group>
              <mesh 
                ref={meshRef} 
                onClick={handleClick}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'default'}
                name={data.id}
              >
                <sphereGeometry args={[scaledRadius, 64, 64]} />
                {useTexturedSurface ? (
                  <meshBasicMaterial
                    color={data.textureColor ?? '#ffffff'}
                    map={colorMap || null}
                  />
                ) : (
                  <meshStandardMaterial 
                    color={colorMap ? (data.textureColor ?? '#ffffff') : data.color}
                    map={colorMap || null}
                    bumpMap={bumpMap || null}
                    bumpScale={bumpMap ? 0.05 : 0}
                    roughnessMap={specularMap || null} // Use specular map as roughness (invert logic handles by some textures, but let's fall back to visual tweak)
                    roughness={specularMap ? 0.8 : 0.7} 
                    metalness={specularMap ? 0.2 : 0.1}
                  />
                )}

                {useLayeredLighting && (
                  <mesh>
                    <sphereGeometry args={[scaledRadius, 64, 64]} />
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
                
                {/* Selection highlight */}
                {isSelected && (
                  <mesh>
                    <sphereGeometry args={[scaledRadius * 1.1, 32, 32]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.08} side={THREE.BackSide} />
                  </mesh>
                )}
              </mesh>
              
              {/* Cloud Layer overrides */}
              {cloudsMap && (
                <mesh ref={cloudsRef}>
                  <sphereGeometry args={[scaledRadius * 1.01, 64, 64]} />
                  <meshBasicMaterial 
                    color="#ffffff"
                    alphaMap={cloudsMap}
                    transparent={true}
                    opacity={0.2}
                    depthWrite={false}
                  />
                </mesh>
              )}
              
              {/* Atmospheric Glow */}
              {data.hasAtmosphere && (
                <Atmosphere radius={cloudsMap ? scaledRadius * 1.02 : scaledRadius} color={data.color} />
              )}
            </group>

            {/* Saturn's Rings - Decoupled from the planet's rapid Y-spin to avoid aliasing artifacts */}
            {data.hasRings && (
              <>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[scaledRadius * 1.2, scaledRadius * 2.2, 128]} />
                  {useLayeredRings ? (
                    <meshBasicMaterial
                      color="#ffffff"
                      map={ringMap || null}
                      transparent
                      opacity={1}
                      side={THREE.DoubleSide}
                      alphaMap={ringMap || null}
                      alphaTest={0.02}
                      depthWrite={false}
                    />
                  ) : (
                    <meshStandardMaterial 
                      color={data.color}
                      map={ringMap || null}
                      transparent 
                      opacity={ringMap ? 0.9 : 0.6} 
                      side={THREE.DoubleSide} 
                      alphaMap={ringMap || null}
                      alphaTest={0.01}
                    />
                  )}
                </mesh>

                {useLayeredRings && (
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[scaledRadius * 1.2, scaledRadius * 2.2, 128]} />
                    <meshLambertMaterial
                      color="#ffffff"
                      transparent
                      opacity={0.4}
                      side={THREE.DoubleSide}
                      alphaMap={ringMap || null}
                      alphaTest={0.02}
                      blending={THREE.MultiplyBlending}
                      depthWrite={false}
                      polygonOffset={true}
                      polygonOffsetFactor={-1}
                      polygonOffsetUnits={-1}
                    />
                  </mesh>
                )}
              </>
            )}
          </group>

          {/* HTML Label */}
          {showLabels && (
            <Html position={[0, -scaledRadius * 2.0, 0]} center zIndexRange={[100, 0]}>
              <div 
                className={`text-sm tracking-wider font-semibold pointer-events-none transition-opacity duration-300 ${isSelected ? 'text-white opacity-100 drop-shadow-md' : 'text-white/50 opacity-100 hover:text-white/80'}`}
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
