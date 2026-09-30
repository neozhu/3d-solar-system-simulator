import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { solarSystemData } from '../../data/solarSystemData';
import { calculateKeplerianPosition } from '../../utils/kepler';
import { getScaledRadius, getScaledSatelliteDistance } from '../../utils/scaling';
import { useSimulationStore } from '../../store/useSimulationStore';

const MAX_BODIES = 16;

const spacetimeVertexShader = `
uniform vec3 uBodyPositions[${MAX_BODIES}];
uniform float uBodyDepths[${MAX_BODIES}];
uniform float uBodyWidths[${MAX_BODIES}];
uniform int uBodyCount;
uniform float uIntensity;

varying vec3 vWorldPos;
varying float vDisplacement;

void main() {
  vec3 localPos = position;
  
  // Transform plane vertex to world coordinate space before deformation
  vec4 initialWorldPos = modelMatrix * vec4(localPos, 1.0);
  
  float totalDisp = 0.0;
  
  // Compute gravitational potential superposition from all celestial bodies
  for (int i = 0; i < ${MAX_BODIES}; i++) {
    if (i >= uBodyCount) break;
    
    vec3 bPos = uBodyPositions[i];
    float depth = uBodyDepths[i];
    float width = uBodyWidths[i];
    
    // Horizontal distance in X-Z orbital plane
    float dx = initialWorldPos.x - bPos.x;
    float dz = initialWorldPos.z - bPos.z;
    float distSq = dx * dx + dz * dz;
    
    // A smooth, finite well with a level center and a quiet outer membrane.
    float dist = sqrt(distSq);
    float falloff = 1.0 - smoothstep(width * 2.0, width * 6.0, dist);
    totalDisp += depth * inversesqrt(1.0 + distSq / (width * width)) * falloff;
  }
  
  float finalDisplacement = totalDisp * uIntensity;
  
  // Local +Z points along world +Y after the plane's -PI/2 rotation.
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

void main() {
  // Anti-aliased grid lines; finer spacing makes local planetary wells readable.
  vec2 coordMinor = vWorldPos.xz / 4.0;
  vec2 gridMinor = abs(fract(coordMinor - 0.5) - 0.5) / max(fwidth(coordMinor), vec2(0.0001));
  float lineMinor = 1.0 - min(min(gridMinor.x, gridMinor.y), 1.0);
  
  // Major grid lines (spacing = 20 units)
  vec2 coordMajor = vWorldPos.xz / 20.0;
  vec2 gridMajor = abs(fract(coordMajor - 0.5) - 0.5) / max(fwidth(coordMajor), vec2(0.0001));
  float lineMajor = 1.0 - min(min(gridMajor.x, gridMajor.y), 1.0);
  
  // Anti-aliased composite grid wireframe intensity
  float gridIntensity = max(lineMinor * 0.3, lineMajor * 0.6);
  
  // Distance from center of solar system (Sun) for radial edge fade
  float distCenter = length(vWorldPos.xz);
  float edgeFade = 1.0 - smoothstep(uFadeRadius * 0.55, uFadeRadius, distCenter);
  
  // Depth-based color transitions
  float depthRatio = clamp(vDisplacement / 28.0, 0.0, 1.0);
  float sunProximity = 1.0 - smoothstep(12.0, 65.0, distCenter);
  
  // Wireframe line color: Deep Blue/Cyan -> Electric Teal -> Solar Amber/Gold
  vec3 wireColor = mix(uColorMinor, uColorMajor, lineMajor);
  wireColor = mix(wireColor, uColorWellPlanet, depthRatio * 0.65);
  wireColor = mix(wireColor, uColorWellSun, sunProximity * 0.7);
  
  // Translucent spacetime membrane fill between grid lines
  float membraneAlpha = 0.012 + depthRatio * 0.025;
  vec3 membraneColor = vec3(0.01, 0.025, 0.045);
  
  // Keep the fabric subordinate to the bodies and their orbit lines.
  vec3 finalColor = mix(membraneColor, wireColor, min(gridIntensity * 2.0, 1.0));
  float finalAlpha = (gridIntensity * 0.7 + membraneAlpha) * edgeFade;
  
  // Discard nearly invisible fragments for performance
  if (finalAlpha < 0.005) discard;
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

const SpacetimeGrid: React.FC = () => {
  const showGravityGrid = useSimulationStore((state) => state.showGravityGrid);
  
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Preallocate reusable uniform arrays for GPU
  const { bodies, positionsArray, depthsArray, widthsArray } = useMemo(() => {
    const bodies = solarSystemData.flatMap(body => [
      { body, parent: null },
      ...(body.satellites ?? [])
        .filter(satellite => (satellite.visualMass ?? 0) > 0)
        .map(satellite => ({ body: satellite, parent: body })),
    ]).slice(0, MAX_BODIES);
    const positionsArray = Array.from({ length: MAX_BODIES }, () => new THREE.Vector3());
    const depthsArray = new Float32Array(MAX_BODIES);
    const widthsArray = new Float32Array(MAX_BODIES);
    bodies.forEach(({ body }, index) => {
      const mass = body.visualMass ?? 10;
      depthsArray[index] = body.id === 'sun' ? 24 : body.category === 'moon' ? 1.5 : 2.2 + Math.sqrt(mass) * 0.9;
      widthsArray[index] = body.id === 'sun' ? 16 : Math.max(2.5, getScaledRadius(body.radiusKm, body.id) * 1.1);
    });
    return { bodies, positionsArray, depthsArray, widthsArray };
  }, []);

  const spacetimeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: spacetimeVertexShader,
      fragmentShader: spacetimeFragmentShader,
      uniforms: {
        uBodyPositions: { value: positionsArray },
        uBodyDepths: { value: depthsArray },
        uBodyWidths: { value: widthsArray },
        uBodyCount: { value: bodies.length },
        uIntensity: { value: 1 },
        uColorMinor: { value: new THREE.Color('#246078') },
        uColorMajor: { value: new THREE.Color('#408da6') },
        uColorWellPlanet: { value: new THREE.Color('#41b8be') },
        uColorWellSun: { value: new THREE.Color('#cb955b') },
        uFadeRadius: { value: 220.0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, [bodies, positionsArray, depthsArray, widthsArray]);

  useFrame(() => {
    if (!showGravityGrid || !materialRef.current) return;
    
    const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
    const currentIntensity = useSimulationStore.getState().gravityGridIntensity;
    
    bodies.forEach(({ body, parent }, index) => {
      if (body.id === 'sun') return;
      const elements = {
        semiMajorAxisAU: body.distanceFromSunAU,
        eccentricity: body.eccentricity ?? 0,
        inclinationDeg: body.inclinationDeg ?? 0,
        longitudeOfAscendingNodeDeg: body.longitudeOfAscendingNodeDeg ?? 0,
        argumentOfPeriapsisDeg: body.argumentOfPeriapsisDeg ?? 0,
        orbitalPeriodDays: body.orbitalPeriodDays,
      };
      if (parent) {
        const parentRadius = getScaledRadius(parent.radiusKm, parent.id);
        const offset = calculateKeplerianPosition(elements, timeElapsedDays, distanceAU =>
          getScaledSatelliteDistance(distanceAU, parentRadius, parent.hasRings));
        const parentIndex = bodies.findIndex(entry => entry.body.id === parent.id);
        positionsArray[index].copy(positionsArray[parentIndex]).add(offset);
      } else {
        positionsArray[index].copy(calculateKeplerianPosition(elements, timeElapsedDays));
      }
    });

    materialRef.current.uniforms.uIntensity.value = currentIntensity;
  });

  if (!showGravityGrid) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      {/* Two-unit sampling resolves local wells without an oversized background grid. */}
      <planeGeometry args={[480, 480, 240, 240]} />
      <primitive ref={materialRef} object={spacetimeMaterial} attach="material" />
    </mesh>
  );
};

export default SpacetimeGrid;
