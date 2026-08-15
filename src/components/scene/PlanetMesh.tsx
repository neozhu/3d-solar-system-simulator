import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Trail, Line } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius, calculateRotationAngle } from '../../utils/scaling';
import { calculateKeplerianPosition, generateKeplerianOrbitPoints } from '../../utils/kepler';
import Atmosphere from './Atmosphere';
import SatelliteMesh from './SatelliteMesh';

interface PlanetMeshProps {
  data: PlanetData;
}

// Day/Night surface shader for Earth & Mars with subtle night lights and smooth terminator
const dayNightVertexShader = `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const dayNightFragmentShader = `
uniform sampler2D uDayMap;
uniform bool uIsEarth;
uniform vec3 uSunPosition;
uniform vec3 uTint;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 L = normalize(uSunPosition - vWorldPosition);

  float NdotL = dot(N, L);
  // Smooth day-night terminator
  float dayFactor = smoothstep(-0.15, 0.2, NdotL);
  
  vec4 dayColor = texture2D(uDayMap, vUv) * vec4(uTint, 1.0);

  // Night lights for Earth: procedurally generate warm amber urban glow on land masses (where dayColor has land tone)
  vec3 finalColor;
  if (uIsEarth) {
    // Land detection (oceans are deep blue, land is greener/browner)
    float isLand = smoothstep(0.12, 0.35, dayColor.r + dayColor.g - dayColor.b * 0.8);
    vec3 nightCityLights = vec3(1.0, 0.75, 0.35) * isLand * 0.85;
    float nightFactor = smoothstep(0.1, -0.25, NdotL);
    
    // Ambient space light on night side
    vec3 ambientNight = dayColor.rgb * 0.04;
    
    finalColor = dayColor.rgb * dayFactor + (nightCityLights + ambientNight) * nightFactor;
  } else {
    // Standard celestial body with realistic ambient shadow
    vec3 ambient = dayColor.rgb * 0.05;
    finalColor = dayColor.rgb * dayFactor + ambient;
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Saturn Ring Shader with planet body shadow casting
const ringVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  vUv = uv;
  vLocalPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const ringFragmentShader = `
uniform sampler2D uRingTexture;
uniform vec3 uPlanetCenter;
uniform float uPlanetRadius;
uniform vec3 uSunPosition;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  // Sample ring texture along radius
  float r = length(vLocalPosition.xy);
  // Map r to UV (texture spans inner to outer radius)
  vec4 ringTex = texture2D(uRingTexture, vec2(vUv.x, 0.5));
  
  // Calculate if this fragment on the ring is in Saturn's cylindrical shadow
  // Sun is at (0,0,0), vector from Sun to Planet:
  vec3 sunToPlanet = normalize(uPlanetCenter - uSunPosition);
  vec3 fragVector = vWorldPosition - uPlanetCenter;
  
  // Projection along shadow cylinder axis
  float distAlongAxis = dot(fragVector, sunToPlanet);
  // Distance perpendicular to shadow axis
  vec3 perpVector = fragVector - sunToPlanet * distAlongAxis;
  float perpDist = length(perpVector);
  
  // In shadow if behind planet (distAlongAxis > 0) and within planet radius
  float inShadow = (distAlongAxis > 0.0 && perpDist < uPlanetRadius * 1.02) ? 1.0 : 0.0;
  float shadowFactor = inShadow > 0.5 ? 0.08 : 1.0;

  // Alpha cutout based on ring texture
  float alpha = ringTex.a > 0.05 ? ringTex.a : ringTex.r;
  alpha = clamp(alpha * 0.9, 0.0, 1.0);

  vec3 ringColor = ringTex.rgb * shadowFactor;

  gl_FragColor = vec4(ringColor, alpha);
}
`;

const PlanetMesh: React.FC<PlanetMeshProps> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const planetGroupRef = useRef<THREE.Group>(null);
  const ringMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const dayNightMaterialRef = useRef<THREE.ShaderMaterial>(null);
  
  const showLabels = useSimulationStore(state => state.showLabels);
  const showOrbits = useSimulationStore(state => state.showOrbits);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);
  
  const scaledRadius = getScaledRadius(data.radiusKm, data.id);
  const isSelected = useSimulationStore(state => state.selectedPlanetId === data.id);

  const [colorMap, setColorMap] = useState<THREE.Texture | null>(null);
  const [ringMap, setRingMap] = useState<THREE.Texture | null>(null);
  const [cloudsMap, setCloudsMap] = useState<THREE.Texture | null>(null);

  const cloudsRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    if (data.textureUrl) {
      loader.load(data.textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setColorMap(tex);
      });
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
  }, [data.textureUrl, data.ringTextureUrl, data.cloudsMapUrl, data.hasRings]);

  // Pre-calculate 3D elliptical orbit trajectory
  const orbitPoints = useMemo(() => {
    return generateKeplerianOrbitPoints({
      semiMajorAxisAU: data.distanceFromSunAU,
      eccentricity: data.eccentricity ?? 0,
      inclinationDeg: data.inclinationDeg ?? 0,
      longitudeOfAscendingNodeDeg: data.longitudeOfAscendingNodeDeg ?? 0,
      argumentOfPeriapsisDeg: data.argumentOfPeriapsisDeg ?? 0,
      orbitalPeriodDays: data.orbitalPeriodDays,
    }, 200);
  }, [data]);

  // Day/Night surface material for textured planets
  const dayNightMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: dayNightVertexShader,
    fragmentShader: dayNightFragmentShader,
    uniforms: {
      uDayMap: { value: null },
      uIsEarth: { value: data.id === 'earth' },
      uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      uTint: { value: new THREE.Color(data.textureColor ?? '#ffffff') },
    },
  }), [data.id, data.textureColor]);

  // Ring material with shadow casting
  const ringMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ringVertexShader,
    fragmentShader: ringFragmentShader,
    uniforms: {
      uRingTexture: { value: null },
      uPlanetCenter: { value: new THREE.Vector3() },
      uPlanetRadius: { value: scaledRadius },
      uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [scaledRadius]);

  useEffect(() => {
    if (colorMap && dayNightMaterialRef.current) {
      dayNightMaterialRef.current.uniforms.uDayMap.value = colorMap;
    }
  }, [colorMap]);

  useEffect(() => {
    if (ringMap && ringMaterialRef.current) {
      ringMaterialRef.current.uniforms.uRingTexture.value = ringMap;
    }
  }, [ringMap]);

  useFrame(() => {
    const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
    
    // 1. Calculate 3D Keplerian Position
    const pos = calculateKeplerianPosition({
      semiMajorAxisAU: data.distanceFromSunAU,
      eccentricity: data.eccentricity ?? 0,
      inclinationDeg: data.inclinationDeg ?? 0,
      longitudeOfAscendingNodeDeg: data.longitudeOfAscendingNodeDeg ?? 0,
      argumentOfPeriapsisDeg: data.argumentOfPeriapsisDeg ?? 0,
      orbitalPeriodDays: data.orbitalPeriodDays,
    }, timeElapsedDays);

    if (planetGroupRef.current) {
      planetGroupRef.current.position.copy(pos);
    }
    
    // 2. Planet self-rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays, timeElapsedDays);
    }
    
    // 3. Clouds layer differential rotation
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays * 0.85, timeElapsedDays);
    }

    // 4. Update Ring shader planet world center for shadow casting
    if (ringMaterialRef.current) {
      ringMaterialRef.current.uniforms.uPlanetCenter.value.copy(pos);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedPlanetId(data.id);
  };

  const useDayNightShader = !!colorMap;

  return (
    <group>
      {/* 3D Elliptical Orbit Line */}
      {showOrbits && (
        <Line points={orbitPoints} color="#ffffff" transparent opacity={0.08} lineWidth={1} />
      )}
      
      {/* Planet Group at Keplerian 3D Position */}
      <group ref={planetGroupRef}>
        
        {/* Dynamic Orbital Motion Trail */}
        {showOrbits && (
          <Trail
            width={scaledRadius * 2.5}
            length={120}
            color={new THREE.Color(data.color)}
            attenuation={(t) => t * t}
            target={meshRef as React.MutableRefObject<THREE.Object3D>}
          >
            <meshBasicMaterial opacity={0.25} transparent />
          </Trail>
        )}

        {/* Tilted Axis Group (Holds planet, atmosphere, and rings at axial tilt) */}
        <group rotation={[0, 0, THREE.MathUtils.degToRad(data.axialTiltDegrees)]}>
          
          {/* Planet Sphere */}
          <mesh 
            ref={meshRef} 
            onClick={handleClick}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
            name={data.id}
          >
            <sphereGeometry args={[scaledRadius, 64, 64]} />
            {useDayNightShader ? (
              <primitive ref={dayNightMaterialRef} object={dayNightMaterial} attach="material" />
            ) : (
              <meshStandardMaterial 
                color={data.color}
                roughness={0.7} 
                metalness={0.1}
              />
            )}

            {/* Selection highlight */}
            {isSelected && (
              <mesh>
                <sphereGeometry args={[scaledRadius * 1.12, 32, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.BackSide} />
              </mesh>
            )}
          </mesh>
          
          {/* Clouds Layer */}
          {cloudsMap && (
            <mesh ref={cloudsRef}>
              <sphereGeometry args={[scaledRadius * 1.015, 64, 64]} />
              <meshBasicMaterial 
                color="#ffffff"
                alphaMap={cloudsMap}
                transparent={true}
                opacity={0.25}
                depthWrite={false}
              />
            </mesh>
          )}
          
          {/* Atmospheric Rayleigh Scattering Glow */}
          {data.hasAtmosphere && (
            <Atmosphere radius={cloudsMap ? scaledRadius * 1.02 : scaledRadius} color={data.color} />
          )}

          {/* Saturn's Rings with Shadow Casting */}
          {data.hasRings && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[scaledRadius * 1.3, scaledRadius * 2.5, 128]} />
              {ringMap ? (
                <primitive ref={ringMaterialRef} object={ringMaterial} attach="material" />
              ) : (
                <meshStandardMaterial 
                  color={data.color}
                  transparent 
                  opacity={0.7} 
                  side={THREE.DoubleSide} 
                />
              )}
            </mesh>
          )}
        </group>

        {/* Natural Satellites / Moons */}
        {data.satellites && data.satellites.map(sat => (
          <SatelliteMesh key={sat.id} data={sat} />
        ))}

        {/* 2D Billboard HTML Label */}
        {showLabels && (
          <Html position={[0, -scaledRadius * 2.0, 0]} center zIndexRange={[100, 0]}>
            <div 
              className={`text-sm tracking-wider font-semibold pointer-events-none transition-opacity duration-300 ${isSelected ? 'text-white opacity-100 drop-shadow-md' : 'text-white/60 opacity-100 hover:text-white/90'}`}
              style={{ textShadow: '0px 0px 4px black' }}
            >
              {data.name}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

export default PlanetMesh;
