import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { solarSystemData } from '../../data/solarSystemData';
import { calculateKeplerianPosition } from '../../utils/kepler';
import { useSimulationStore } from '../../store/useSimulationStore';

const MAX_BODIES = 16;

const spacetimeVertexShader = `
uniform vec3 uBodyPositions[${MAX_BODIES}];
uniform float uBodyMasses[${MAX_BODIES}];
uniform int uBodyCount;
uniform float uIntensity;
uniform float uTime;

varying vec3 vWorldPos;
varying float vDisplacement;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 localPos = position;
  
  // Transform plane vertex to world coordinate space before deformation
  vec4 initialWorldPos = modelMatrix * vec4(localPos, 1.0);
  
  float totalDisp = 0.0;
  
  // Compute gravitational potential superposition from all celestial bodies
  for (int i = 0; i < ${MAX_BODIES}; i++) {
    if (i >= uBodyCount) break;
    
    vec3 bPos = uBodyPositions[i];
    float mass = uBodyMasses[i];
    if (mass <= 0.01) continue;
    
    // Horizontal distance in X-Z orbital plane
    float dx = initialWorldPos.x - bPos.x;
    float dz = initialWorldPos.z - bPos.z;
    float distSq = dx * dx + dz * dz;
    
    // Adaptive softening radius based on body mass to avoid singular spikes
    float softening = max(2.5, sqrt(mass) * 1.8);
    float dist = sqrt(distSq + softening * softening);
    
    // Gravitational potential well: -G * M / r
    float wellDepth = (mass * 6.5) / (dist + 1.2);
    
    // Subtle dynamic gravitational ripple wave based on distance
    float wave = sin(dist * 0.18 - uTime * 2.5) * (mass * 0.12) / (dist + 15.0);
    
    totalDisp += wellDepth + wave;
  }
  
  float finalDisplacement = totalDisp * uIntensity;
  
  // Deform along local Z axis (which points along world -Y when rotated -PI/2 on X)
  localPos.z -= finalDisplacement;
  
  vDisplacement = finalDisplacement;
  
  vec4 deformedWorldPos = modelMatrix * vec4(localPos, 1.0);
  vWorldPos = deformedWorldPos.xyz;
  
  gl_Position = projectionMatrix * viewMatrix * deformedWorldPos;
}
`;

const spacetimeFragmentShader = `
uniform vec3 uColorMinor;
uniform vec3 uColorMajor;
uniform vec3 uColorWellPlanet;
uniform vec3 uColorWellSun;
uniform float uFadeRadius;

varying vec3 vWorldPos;
varying float vDisplacement;
varying vec2 vUv;

void main() {
  // Minor grid lines (spacing = 8 units)
  vec2 coordMinor = vWorldPos.xz / 8.0;
  vec2 gridMinor = abs(fract(coordMinor - 0.5) - 0.5) / fwidth(coordMinor);
  float lineMinor = 1.0 - min(min(gridMinor.x, gridMinor.y), 1.0);
  
  // Major grid lines (spacing = 40 units)
  vec2 coordMajor = vWorldPos.xz / 40.0;
  vec2 gridMajor = abs(fract(coordMajor - 0.5) - 0.5) / fwidth(coordMajor);
  float lineMajor = 1.0 - min(min(gridMajor.x, gridMajor.y), 1.0);
  
  // Anti-aliased composite grid wireframe intensity
  float gridIntensity = max(lineMinor * 0.35, lineMajor * 0.85);
  
  // Gravitational equipotential contour rings (Iso-potential lines)
  float contourCoord = vDisplacement * 0.4;
  vec2 contourGrid = vec2(abs(fract(contourCoord - 0.5) - 0.5) / fwidth(contourCoord), 0.0);
  float contourLine = 1.0 - min(contourGrid.x, 1.0);
  
  // Distance from center of solar system (Sun) for radial edge fade
  float distCenter = length(vWorldPos.xz);
  float edgeFade = smoothstep(uFadeRadius, uFadeRadius * 0.45, distCenter);
  
  // Depth-based color transitions
  float depthRatio = clamp(vDisplacement / 42.0, 0.0, 1.0);
  float sunProximity = smoothstep(70.0, 0.0, distCenter);
  
  // Wireframe line color: Deep Blue/Cyan -> Electric Teal -> Solar Amber/Gold
  vec3 wireColor = mix(uColorMinor, uColorWellPlanet, clamp(depthRatio * 1.5, 0.0, 1.0));
  wireColor = mix(wireColor, uColorWellSun, sunProximity * 0.85 + depthRatio * 0.35);
  
  // Translucent spacetime membrane fill between grid lines
  float membraneAlpha = 0.035 + depthRatio * 0.12;
  vec3 membraneColor = mix(vec3(0.01, 0.03, 0.08), vec3(0.08, 0.02, 0.15), depthRatio);
  
  // Combine wireframe, membrane, contour rings, and edge fade
  vec3 finalColor = mix(membraneColor, wireColor * 1.8, gridIntensity);
  finalColor += uColorWellPlanet * contourLine * 0.3 * (0.2 + depthRatio);
  
  float finalAlpha = (gridIntensity * 0.8 + membraneAlpha + contourLine * 0.2) * edgeFade;
  
  // Discard nearly invisible fragments for performance
  if (finalAlpha < 0.005) discard;
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

const SpacetimeGrid: React.FC = () => {
  const showGravityGrid = useSimulationStore((state) => state.showGravityGrid);
  const gravityGridIntensity = useSimulationStore((state) => state.gravityGridIntensity);
  
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Preallocate reusable uniform arrays for GPU
  const { positionsArray, massesArray, activeBodyCount } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const masses: number[] = [];
    
    // Collect celestial bodies with valid visual masses
    solarSystemData.forEach((body) => {
      if (positions.length < MAX_BODIES) {
        positions.push(new THREE.Vector3(0, 0, 0));
        masses.push(body.visualMass ?? (body.id === 'sun' ? 100 : 10));
      }
      // Include notable massive satellites (e.g. Earth Moon)
      if (body.satellites) {
        body.satellites.forEach((sat) => {
          if (positions.length < MAX_BODIES && (sat.visualMass ?? 0) > 0) {
            positions.push(new THREE.Vector3(0, 0, 0));
            masses.push(sat.visualMass ?? 3);
          }
        });
      }
    });
    
    // Fill up to MAX_BODIES
    while (positions.length < MAX_BODIES) {
      positions.push(new THREE.Vector3(0, 0, 0));
      masses.push(0);
    }
    
    return {
      positionsArray: positions,
      massesArray: masses,
      activeBodyCount: Math.min(solarSystemData.length + 1, MAX_BODIES),
    };
  }, []);

  const spacetimeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: spacetimeVertexShader,
      fragmentShader: spacetimeFragmentShader,
      uniforms: {
        uBodyPositions: { value: positionsArray },
        uBodyMasses: { value: massesArray },
        uBodyCount: { value: activeBodyCount },
        uIntensity: { value: gravityGridIntensity },
        uTime: { value: 0 },
        uColorMinor: { value: new THREE.Color('#144c82') },
        uColorMajor: { value: new THREE.Color('#1e88e5') },
        uColorWellPlanet: { value: new THREE.Color('#00e5ff') },
        uColorWellSun: { value: new THREE.Color('#ffaa00') },
        uFadeRadius: { value: 650.0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, [positionsArray, massesArray, activeBodyCount, gravityGridIntensity]);

  useFrame((state) => {
    if (!showGravityGrid || !materialRef.current) return;
    
    const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
    const currentIntensity = useSimulationStore.getState().gravityGridIntensity;
    
    let index = 0;
    
    // 1. Calculate and update celestial bodies positions in real time
    solarSystemData.forEach((body) => {
      if (index >= MAX_BODIES) return;
      
      let pos = new THREE.Vector3(0, 0, 0);
      if (body.id !== 'sun') {
        pos = calculateKeplerianPosition({
          semiMajorAxisAU: body.distanceFromSunAU,
          eccentricity: body.eccentricity ?? 0,
          inclinationDeg: body.inclinationDeg ?? 0,
          longitudeOfAscendingNodeDeg: body.longitudeOfAscendingNodeDeg ?? 0,
          argumentOfPeriapsisDeg: body.argumentOfPeriapsisDeg ?? 0,
          orbitalPeriodDays: body.orbitalPeriodDays,
        }, timeElapsedDays);
      }
      
      positionsArray[index].copy(pos);
      const parentPos = pos.clone();
      index++;
      
      // Calculate satellite positions relative to their parent planet
      if (body.satellites) {
        body.satellites.forEach((sat) => {
          if (index >= MAX_BODIES || (sat.visualMass ?? 0) <= 0) return;
          const satOffset = calculateKeplerianPosition({
            semiMajorAxisAU: sat.distanceFromSunAU,
            eccentricity: sat.eccentricity ?? 0,
            inclinationDeg: sat.inclinationDeg ?? 0,
            longitudeOfAscendingNodeDeg: sat.longitudeOfAscendingNodeDeg ?? 0,
            argumentOfPeriapsisDeg: sat.argumentOfPeriapsisDeg ?? 0,
            orbitalPeriodDays: sat.orbitalPeriodDays,
          }, timeElapsedDays);
          
          positionsArray[index].copy(parentPos.clone().add(satOffset));
          index++;
        });
      }
    });

    materialRef.current.uniforms.uIntensity.value = currentIntensity;
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  if (!showGravityGrid) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      {/* High density plane: 1400x1400 units, 180x180 segments (32.4k vertices) */}
      <planeGeometry args={[1400, 1400, 180, 180]} />
      <primitive ref={materialRef} object={spacetimeMaterial} attach="material" />
    </mesh>
  );
};

export default SpacetimeGrid;
