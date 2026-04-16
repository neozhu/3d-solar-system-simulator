import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, Billboard } from '@react-three/drei';
import { PlanetData } from '../../data/solarSystemData';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getScaledRadius, calculateRotationAngle } from '../../utils/scaling';

interface SunMeshProps {
  data: PlanetData;
}

// ============================================================
// Corona + CME Billboard Shader
// ============================================================
const coronaVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const coronaFragmentShader = `
uniform float time;
varying vec2 vUv;

float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash2(i);
  float b = hash2(i + vec2(1.0, 0.0));
  float c = hash2(i + vec2(0.0, 1.0));
  float d = hash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv - 0.5;
  float d = length(uv);
  float angle = atan(uv.y, uv.x);
  
  // Sun surface at d = 0.2 (radius / half-plane-size = R / (R*2.5))
  float surfaceD = 0.2;
  
  // ========================================
  // A. BASE CORONA (smooth glow just outside surface)
  // ========================================
  float wobble = sin(angle * 5.0 - time * 2.0) * 0.005 + sin(angle * 8.0 + time * 1.5) * 0.003;
  float coronaBase = smoothstep(0.34, surfaceD, d + wobble) * smoothstep(surfaceD - 0.02, surfaceD, d);
  
  // ========================================
  // B. CORONAL MASS EJECTIONS (CME) — large blob eruptions
  // ========================================
  // CME #1
  float cmeAngle1 = 1.2 + sin(time * 0.05) * 0.5;
  float cmePhase1 = fract(time * 0.08);
  float cmeRadius1 = surfaceD + cmePhase1 * 0.3;
  float cmeSize1 = 0.04 + cmePhase1 * 0.06;
  vec2 cmeCenter1 = vec2(cos(cmeAngle1), sin(cmeAngle1)) * cmeRadius1;
  float cmeDist1 = length(uv - cmeCenter1);
  float cmeBlob1 = smoothstep(cmeSize1, cmeSize1 * 0.3, cmeDist1) * (1.0 - cmePhase1);

  // CME #2 (offset timing)
  float cmeAngle2 = -0.8 + cos(time * 0.04) * 0.6;
  float cmePhase2 = fract(time * 0.08 + 0.5);
  float cmeRadius2 = surfaceD + cmePhase2 * 0.25;
  float cmeSize2 = 0.03 + cmePhase2 * 0.05;
  vec2 cmeCenter2 = vec2(cos(cmeAngle2), sin(cmeAngle2)) * cmeRadius2;
  float cmeDist2 = length(uv - cmeCenter2);
  float cmeBlob2 = smoothstep(cmeSize2, cmeSize2 * 0.3, cmeDist2) * (1.0 - cmePhase2);

  // CME #3 (different frequency)
  float cmeAngle3 = 2.8 + sin(time * 0.03 + 2.0) * 0.4;
  float cmePhase3 = fract(time * 0.06 + 0.33);
  float cmeRadius3 = surfaceD + cmePhase3 * 0.35;
  float cmeSize3 = 0.035 + cmePhase3 * 0.055;
  vec2 cmeCenter3 = vec2(cos(cmeAngle3), sin(cmeAngle3)) * cmeRadius3;
  float cmeDist3 = length(uv - cmeCenter3);
  float cmeBlob3 = smoothstep(cmeSize3, cmeSize3 * 0.3, cmeDist3) * (1.0 - cmePhase3);
  
  float cmeTotal = cmeBlob1 + cmeBlob2 + cmeBlob3;
  
  // ========================================
  // C. TURBULENT CORONA WISPS
  // ========================================
  float wisps = fbm(vec2(angle * 6.0 - time * 0.2, d * 15.0 + time * 0.1)) * 0.25;
  wisps *= smoothstep(0.38, surfaceD, d) * smoothstep(surfaceD - 0.01, surfaceD + 0.02, d);

  // ========================================
  // COMBINE ALL
  // ========================================
  float totalAlpha = clamp(coronaBase + cmeTotal + wisps, 0.0, 1.0);
  
  // Cut hole in center to reveal the textured sun sphere beneath
  totalAlpha *= smoothstep(surfaceD - 0.03, surfaceD, d);
  
  // Dynamic pulse
  float pulse = sin(time * 2.5) * 0.06 + 0.94;
  
  // Cinematic coloring by distance from surface
  vec3 coreWhite = vec3(1.0, 0.98, 0.9);
  vec3 hotYellow = vec3(1.0, 0.85, 0.3);
  vec3 flameOrange = vec3(1.0, 0.5, 0.1);
  vec3 deepRed = vec3(0.7, 0.1, 0.0);
  vec3 darkCrimson = vec3(0.3, 0.02, 0.0);
  
  // Layer the colors by distance
  float normD = smoothstep(surfaceD, 0.48, d);
  vec3 color = mix(coreWhite, hotYellow, smoothstep(0.0, 0.15, normD)) * pulse;
  color = mix(color, flameOrange, smoothstep(0.15, 0.4, normD));
  color = mix(color, deepRed, smoothstep(0.4, 0.7, normD));
  color = mix(color, darkCrimson, smoothstep(0.7, 1.0, normD));
  
  // CME blobs are hotter (whiter)
  color = mix(color, hotYellow * 1.3, cmeTotal * 0.6);
  
  gl_FragColor = vec4(color, totalAlpha * 0.9);
}
`;

const SunMesh: React.FC<SunMeshProps> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const scaledRadius = getScaledRadius(data.radiusKm, data.id);
  const showLabels = useSimulationStore(state => state.showLabels);
  const isSelected = useSimulationStore(state => state.selectedPlanetId === data.id);
  const setSelectedPlanetId = useSimulationStore(state => state.setSelectedPlanetId);

  const [colorMap, setColorMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (data.textureUrl) {
      new THREE.TextureLoader().load(data.textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setColorMap(tex);
      });
    }
  }, [data.textureUrl]);

  // Corona + CME shader
  const coronaMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: coronaVertexShader,
    fragmentShader: coronaFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const timeElapsedDays = useSimulationStore.getState().globalTimeElapsedDays;
      meshRef.current.rotation.y = calculateRotationAngle(data.rotationPeriodDays, timeElapsedDays);
      meshRef.current.rotation.z = THREE.MathUtils.degToRad(data.axialTiltDegrees);
    }
    coronaMaterial.uniforms.time.value = state.clock.elapsedTime;
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
        <meshBasicMaterial 
          key={colorMap ? 'textured' : 'fallback'}
          color={colorMap ? '#ffffff' : data.color}
          map={colorMap || null}
        />
      </mesh>

      {/* Corona + CME Billboard */}
      <Billboard>
        <mesh material={coronaMaterial}>
          <planeGeometry args={[scaledRadius * 5, scaledRadius * 5]} />
        </mesh>
      </Billboard>

      {/* Selection highlighting */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[scaledRadius * 1.05, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} wireframe />
        </mesh>
      )}
      
      {/* Light source for the rest of the solar system */}
      <pointLight 
        color="#fff1e8" 
        intensity={3.5} 
        distance={2000} 
        decay={0.2} 
      />
      <ambientLight intensity={0.1} />
      
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
