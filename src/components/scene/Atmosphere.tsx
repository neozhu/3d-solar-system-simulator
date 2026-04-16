import React, { useRef } from 'react';
import * as THREE from 'three';

// A beautifully simple custom shader for atmospheric limb darkening / glowing edge
const vertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec3 vNormal;
uniform vec3 glowColor;
uniform float coefficient;
uniform float power;

void main() {
  float intensity = pow(max(0.0, coefficient - dot(vNormal, vec3(0.0, 0.0, 1.0))), power);
  gl_FragColor = vec4(glowColor, intensity * 0.4); // Clamp alpha max
}
`;

interface AtmosphereProps {
  radius: number;
  color: string;
}

const Atmosphere: React.FC<AtmosphereProps> = ({ radius, color }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Extend radius slightly beyond the planet's surface
  const atmosRadius = radius * 1.15;

  return (
    <mesh>
      <sphereGeometry args={[atmosRadius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          glowColor: { value: new THREE.Color(color) },
          coefficient: { value: 0.8 }, // Controls how far in the glow goes
          power: { value: 2.0 },       // Controls sharpness of the glow rim
        }}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

export default Atmosphere;
