import React, { useMemo } from 'react';
import * as THREE from 'three';

// ============================================================
// Procedural Deep Space Nebula Skybox
// A giant inverted sphere with a shader that generates
// colorful nebula clouds using layered FBM noise
// ============================================================

const nebulaVertexShader = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const nebulaFragmentShader = `
varying vec3 vWorldPosition;
uniform float time;

// Hash functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

void main() {
  // Normalize direction from center
  vec3 dir = normalize(vWorldPosition);
  
  // Use direction as noise coordinate (very slow drift for gentle animation)
  vec3 noisePos = dir * 2.0 + vec3(time * 0.001, -time * 0.0005, time * 0.0008);
  
  // === NEBULA CLOUDS ===
  // Multiple layers of FBM at different scales for depth
  float nebula1 = fbm(noisePos * 1.0, 6);             // Large-scale structure
  float nebula2 = fbm(noisePos * 2.5 + 5.0, 5);       // Medium detail
  float nebula3 = fbm(noisePos * 4.0 + 10.0, 4);      // Fine wisps
  
  // Shape the clouds: threshold and smooth them
  float cloud1 = smoothstep(-0.1, 0.6, nebula1) * 0.6;
  float cloud2 = smoothstep(0.0, 0.5, nebula2) * 0.4;
  float cloud3 = smoothstep(0.1, 0.5, nebula3) * 0.3;
  
  // === NEBULA COLORING ===
  // Deep space palette: subtle purples and blues
  vec3 deepBlue      = vec3(0.02, 0.03, 0.14);
  vec3 cosmicPurple  = vec3(0.10, 0.025, 0.18);
  vec3 nebulaBlue    = vec3(0.05, 0.09, 0.30);
  vec3 nebulaPink    = vec3(0.15, 0.04, 0.12);
  vec3 dustyGold     = vec3(0.08, 0.06, 0.02);
  vec3 voidBlack     = vec3(0.005, 0.006, 0.018);
  
  // Layer 1: Large purple/blue gas clouds
  vec3 color1 = mix(cosmicPurple, nebulaBlue, smoothstep(-0.2, 0.3, nebula1));
  
  // Layer 2: Pink/magenta emission nebula + hints of gold
  vec3 color2 = mix(nebulaPink, dustyGold, smoothstep(-0.1, 0.4, nebula2));
  
  // Layer 3: Blue wisps
  vec3 color3 = mix(deepBlue, nebulaBlue, smoothstep(-0.1, 0.4, nebula3));
  
  // Combine clouds
  vec3 nebulaColor = voidBlack;
  nebulaColor += color1 * cloud1 * 0.9;
  nebulaColor += color2 * cloud2 * 0.7;
  nebulaColor += color3 * cloud3 * 0.6;
  
  // === STAR FIELD (tiny bright points) ===
  // Use a high-frequency noise to place individual stars
  float starNoise = snoise(dir * 80.0);
  float stars = smoothstep(0.88, 0.92, starNoise) * 0.8;
  
  // Some rare brighter stars
  float brightStarNoise = snoise(dir * 40.0 + 100.0);
  float brightStars = smoothstep(0.92, 0.95, brightStarNoise) * 1.2;
  
  // Tint bright stars slightly warm/cool randomly
  float starTint = snoise(dir * 20.0 + 50.0);
  vec3 starColor = mix(vec3(0.8, 0.85, 1.0), vec3(1.0, 0.9, 0.7), smoothstep(-0.5, 0.5, starTint));
  
  // Add stars on top of nebula
  nebulaColor += starColor * (stars + brightStars);
  
  // === GALACTIC PLANE HINT ===
  // Subtle bright band across one axis to suggest a galactic plane
  float galacticBand = exp(-8.0 * dir.y * dir.y); // Gaussian around y=0
  float galacticNoise = fbm(dir * 3.0 + vec3(50.0), 4);
  vec3 galacticColor = mix(deepBlue, nebulaBlue, 0.5) * 0.15;
  nebulaColor += galacticColor * galacticBand * smoothstep(-0.2, 0.3, galacticNoise);
  
  gl_FragColor = vec4(nebulaColor, 1.0);
}
`;

const SpaceBackground: React.FC = () => {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: nebulaVertexShader,
    fragmentShader: nebulaFragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  }), []);

  // Very slow time drift — we don't need useFrame for this, 
  // a static nebula is fine and saves performance
  // But a tiny drift adds life:
  React.useEffect(() => {
    let raf: number;
    const tick = () => {
      material.uniforms.time.value = performance.now() * 0.001;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [material]);

  return (
    <mesh>
      <sphereGeometry args={[3500, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default SpaceBackground;
