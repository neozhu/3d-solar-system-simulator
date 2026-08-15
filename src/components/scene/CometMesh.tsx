import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius } from '../../utils/scaling';
import { calculateKeplerianPosition, generateKeplerianOrbitPoints } from '../../utils/kepler';

interface CometMeshProps {
  data: PlanetData;
}

// Comet Tail Shader: generates smooth flowing ion/dust tail pointing away from the sun
const tailVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const tailFragmentShader = `
varying vec2 vUv;
uniform float uIntensity;
uniform float uTime;

void main() {
  // vUv.y is along the length (0 at head, 1 at tip)
  // vUv.x is across the width (0 to 1, 0.5 at center)
  float distFromCenter = abs(vUv.x - 0.5) * 2.0;
  
  // Radial fade
  float radialFade = smoothstep(1.0, 0.0, distFromCenter);
  
  // Longitudinal fade (bright near nucleus, fading smoothly along tail)
  float lengthFade = pow(1.0 - vUv.y, 1.8);
  
  // Subtle animated wisps along the ion tail
  float wisps = sin(vUv.y * 30.0 - uTime * 4.0 + vUv.x * 10.0) * 0.1 + 0.9;
  
  float alpha = radialFade * lengthFade * wisps * uIntensity;
  alpha = clamp(alpha, 0.0, 0.9);
  
  // Blue-cyan ion core with faint white-gold dust outer edge
  vec3 ionColor = vec3(0.3, 0.8, 1.0);
  vec3 dustColor = vec3(0.9, 0.95, 1.0);
  vec3 color = mix(ionColor, dustColor, distFromCenter * 0.4);

  gl_FragColor = vec4(color, alpha);
}
`;

const CometMesh: React.FC<CometMeshProps> = ({ data }) => {
  const meshGroupRef = useRef<THREE.Group>(null);
  const tailGroupRef = useRef<THREE.Group>(null);
  const tailMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const showLabels = useSimulationStore(state => state.showLabels);
  const showOrbits = useSimulationStore(state => state.showOrbits);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);
  const isSelected = useSimulationStore(state => state.selectedPlanetId === data.id);

  const scaledRadius = getScaledRadius(data.radiusKm, data.id);

  const orbitPoints = useMemo(() => {
    return generateKeplerianOrbitPoints({
      semiMajorAxisAU: data.distanceFromSunAU,
      eccentricity: data.eccentricity ?? 0,
      inclinationDeg: data.inclinationDeg ?? 0,
      longitudeOfAscendingNodeDeg: data.longitudeOfAscendingNodeDeg ?? 0,
      argumentOfPeriapsisDeg: data.argumentOfPeriapsisDeg ?? 0,
      orbitalPeriodDays: data.orbitalPeriodDays,
    }, 240);
  }, [data]);

  const tailMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: tailVertexShader,
    fragmentShader: tailFragmentShader,
    uniforms: {
      uIntensity: { value: 0.8 },
      uTime: { value: 0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);

  useFrame((state) => {
    const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;

    const pos = calculateKeplerianPosition({
      semiMajorAxisAU: data.distanceFromSunAU,
      eccentricity: data.eccentricity ?? 0,
      inclinationDeg: data.inclinationDeg ?? 0,
      longitudeOfAscendingNodeDeg: data.longitudeOfAscendingNodeDeg ?? 0,
      argumentOfPeriapsisDeg: data.argumentOfPeriapsisDeg ?? 0,
      orbitalPeriodDays: data.orbitalPeriodDays,
    }, timeElapsedDays);

    if (meshGroupRef.current) {
      meshGroupRef.current.position.copy(pos);
    }

    // Solar wind pushes comet tail directly away from the Sun (origin at (0,0,0))
    if (tailGroupRef.current) {
      const dirAwayFromSun = pos.clone().normalize();
      // Orient the tail geometry (which extends along +Z or +Y)
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dirAwayFromSun);
      tailGroupRef.current.quaternion.copy(quaternion);

      // Tail activity increases exponentially when closer to the Sun
      const distanceToSun = pos.length();
      const activity = Math.min(Math.max((60 - distanceToSun) / 40, 0.1), 2.5);

      tailGroupRef.current.scale.set(activity * 1.5, activity * 3.0, activity * 1.5);

      if (tailMaterialRef.current) {
        tailMaterialRef.current.uniforms.uIntensity.value = activity * 0.7;
        tailMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedPlanetId(data.id);
  };

  return (
    <group>
      {/* 3D Elliptical Orbit Line */}
      {showOrbits && (
        <Line points={orbitPoints} color="#a0e6ff" transparent opacity={0.15} lineWidth={1} />
      )}

      <group ref={meshGroupRef}>
        {/* Nucleus */}
        <mesh
          onClick={handleClick}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'default'}
          name={data.id}
        >
          <dodecahedronGeometry args={[scaledRadius * 1.5, 1]} />
          <meshStandardMaterial color="#6a7a85" roughness={0.9} />
        </mesh>

        {/* Coma (Gaseous glowing envelope) */}
        <mesh>
          <sphereGeometry args={[scaledRadius * 4.0, 16, 16]} />
          <meshBasicMaterial
            color="#8ee6ff"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Dynamic Comet Tail (Points away from Sun) */}
        <group ref={tailGroupRef}>
          {/* Dual intersecting planes for 3D volumetric feel */}
          <mesh position={[0, 15, 0]} material={tailMaterial}>
            <planeGeometry args={[4, 30]} />
          </mesh>
          <mesh position={[0, 15, 0]} rotation={[0, Math.PI / 2, 0]} material={tailMaterial}>
            <planeGeometry args={[4, 30]} />
          </mesh>
        </group>

        {/* Selection highlight */}
        {isSelected && (
          <mesh>
            <sphereGeometry args={[scaledRadius * 3, 16, 16]} />
            <meshBasicMaterial color="#a0e6ff" transparent opacity={0.2} side={THREE.BackSide} />
          </mesh>
        )}

        {/* Label */}
        {showLabels && (
          <Html position={[0, -scaledRadius * 2.5, 0]} center zIndexRange={[100, 0]}>
            <div
              className={`text-xs tracking-wider font-semibold pointer-events-none transition-opacity duration-300 ${isSelected ? 'text-white opacity-100 drop-shadow-md' : 'text-cyan-200/70'}`}
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

export default CometMesh;
