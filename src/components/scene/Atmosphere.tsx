import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Advanced Sun-Aware Atmospheric Scattering Shader
// Reacts dynamically to sun direction, producing realistic sunlit limb brightening,
// warm twilight/sunset gradients along the terminator line, and zero unnatural glow on the dark side.

const vertexShader = `
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = `
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
uniform vec3 uGlowColor;
uniform vec3 uSunPosition; // Default Sun is at (0,0,0)
uniform vec3 uCameraPos;

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(uCameraPos - vWorldPosition);
  vec3 L = normalize(uSunPosition - vWorldPosition); // Vector towards Sun

  // 1. Fresnel / Rim factor (bright at the geometric limb of the planet)
  float VdotN = max(0.0, dot(V, N));
  float rim = pow(1.0 - VdotN, 2.5);

  // 2. Sunlit illumination factor (N . L)
  float NdotL = dot(N, L);
  // Soft terminator transition from day to night
  float sunLit = smoothstep(-0.2, 0.35, NdotL);

  // 3. Forward scattering / Rayleigh phase approximation
  float VdotL = dot(V, L);
  float phase = 0.75 * (1.0 + 0.6 * VdotL * VdotL);

  // 4. Sunset / Twilight color transition along the terminator
  float terminatorBand = smoothstep(-0.15, 0.25, NdotL) * smoothstep(0.6, 0.05, NdotL);
  vec3 sunsetColor = vec3(1.0, 0.45, 0.15); // Warm amber-red twilight
  vec3 scatterColor = mix(uGlowColor, sunsetColor, terminatorBand * 0.65);

  // 5. Total alpha intensity
  float alpha = rim * sunLit * phase * 0.75;
  alpha = clamp(alpha, 0.0, 0.95);

  gl_FragColor = vec4(scatterColor, alpha);
}
`;

interface AtmosphereProps {
  radius: number;
  color: string;
}

const Atmosphere: React.FC<AtmosphereProps> = ({ radius, color }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Extend radius slightly beyond the planet's surface
  const atmosRadius = radius * 1.12;

  useFrame(({ camera }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uCameraPos.value.copy(camera.position);
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[atmosRadius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uGlowColor: { value: new THREE.Color(color) },
          uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
          uCameraPos: { value: new THREE.Vector3() },
        }}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
};

export default Atmosphere;
