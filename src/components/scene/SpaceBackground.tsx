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

// ---- Hash-based pseudo-random (fast, no noise artifacts) ----
float hash(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}

float hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(443.8975, 397.2973, 491.1871));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}

// ---- Simplex noise (kept for nebula wisps) ----
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

// ============================================================
// STAR LAYER — grid-cell based, produces sharp point stars
// Each cell may or may not contain a star. Stars are placed at
// a random sub-pixel position within the cell, giving a natural
// distribution. The brightness falls off sharply from the center
// to produce pinpoint lights, not blobs.
// ============================================================
float starLayer(vec3 dir, float scale, float density, float seed) {
  // Project direction onto a 2D grid via spherical coords
  float theta = atan(dir.z, dir.x);           // -PI to PI
  float phi   = asin(clamp(dir.y, -1.0, 1.0)); // -PI/2 to PI/2
  vec2 uv = vec2(theta, phi) * scale;

  vec2 cell = floor(uv);
  vec2 frac_uv = fract(uv);

  float brightness = 0.0;

  // Check 3x3 neighborhood to handle stars near cell edges
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 cellId = cell + neighbor;

      // Random position within cell
      float r1 = hash2(cellId * 1.13 + seed);
      float r2 = hash2(cellId * 2.37 + seed + 71.0);
      vec2 starPos = neighbor + vec2(r1, r2) - frac_uv;

      // Distance from fragment to star center
      float dist = length(starPos);

      // Only some cells have stars (controlled by density)
      float hasStar = step(1.0 - density, hash2(cellId * 3.91 + seed + 137.0));

      // Random magnitude per star
      float mag = hash2(cellId * 5.17 + seed + 293.0);
      mag = 0.3 + 0.7 * mag * mag; // bias toward dimmer stars

      // Sharp falloff — real stars are pinpoints
      float glow = hasStar * mag * smoothstep(0.06, 0.0, dist);

      brightness += glow;
    }
  }
  return brightness;
}

// Spectral color from temperature index (0=cool red/orange, 1=hot blue/white)
vec3 starColor(float temp) {
  vec3 cool = vec3(1.0, 0.7, 0.4);   // K/M type — warm orange
  vec3 white = vec3(1.0, 0.98, 0.95); // G type — sun-like
  vec3 hot  = vec3(0.7, 0.8, 1.0);    // O/B type — blue-white

  vec3 col = mix(cool, white, smoothstep(0.0, 0.45, temp));
  col = mix(col, hot, smoothstep(0.45, 1.0, temp));
  return col;
}

void main() {
  vec3 dir = normalize(vWorldPosition);

  // ===== DEEP SPACE BASE =====
  // Nearly pure black with a hint of very deep blue
  vec3 spaceColor = vec3(0.003, 0.004, 0.012);

  // ===== STAR FIELD =====
  // Three layers at different scales for depth variation

  // Layer 1: Sparse bright stars (few, prominent)
  float s1 = starLayer(dir, 50.0, 0.12, 0.0);
  float temp1 = hash(dir * 50.0 + 1.0);
  // Subtle twinkle
  float twinkle1 = 0.85 + 0.15 * sin(time * (1.5 + temp1 * 2.0) + temp1 * 40.0);
  spaceColor += starColor(temp1) * s1 * 1.2 * twinkle1;

  // Layer 2: Medium density stars
  float s2 = starLayer(dir, 100.0, 0.08, 43.0);
  float temp2 = hash(dir * 100.0 + 43.0);
  spaceColor += starColor(temp2) * s2 * 0.5;

  // Layer 3: Dense dim stars (fine dust of faint stars)
  float s3 = starLayer(dir, 200.0, 0.06, 97.0);
  spaceColor += vec3(0.9, 0.92, 1.0) * s3 * 0.2;

  // ===== MILKY WAY BAND =====
  float galacticLat = abs(dir.y);
  float milkyWayWide = exp(-6.0 * galacticLat * galacticLat);
  float milkyWayCore = exp(-25.0 * galacticLat * galacticLat);

  float mwNoise1 = fbm(dir * 2.5 + vec3(50.0, 0.0, 30.0), 5);
  float mwNoise2 = fbm(dir * 5.0 + vec3(80.0, 0.0, 60.0), 4);
  float mwNoise3 = fbm(dir * 8.0 + vec3(15.0, 5.0, 25.0), 3);

  // Outer diffuse glow
  float mwGlowOuter = milkyWayWide * smoothstep(-0.1, 0.45, mwNoise1) * 0.06;
  vec3 mwColorOuter = mix(
    vec3(0.04, 0.04, 0.06),
    vec3(0.05, 0.04, 0.03),
    smoothstep(-0.2, 0.3, mwNoise2)
  );
  spaceColor += mwColorOuter * mwGlowOuter;

  // Bright core
  float mwGlowCore = milkyWayCore * smoothstep(-0.1, 0.35, mwNoise1) * 0.08;
  vec3 mwColorCore = mix(
    vec3(0.06, 0.05, 0.08),
    vec3(0.08, 0.07, 0.05),
    smoothstep(-0.1, 0.4, mwNoise3)
  );
  spaceColor += mwColorCore * mwGlowCore;

  // Dust lanes
  float dustLane = fbm(dir * 4.0 + vec3(20.0, 10.0, 40.0), 4);
  float dustMask = milkyWayWide * smoothstep(0.0, 0.3, dustLane) * 0.03;
  spaceColor = max(spaceColor - dustMask, vec3(0.0));

  // Extra stars along Milky Way
  float mwStars = starLayer(dir, 150.0, 0.15, 211.0);
  spaceColor += vec3(0.85, 0.88, 1.0) * mwStars * milkyWayWide * 0.35;

  // ===== NEBULA WISPS =====
  // Small isolated patches only — high threshold to avoid fog
  vec3 nebulaPos = dir * 1.8 + vec3(time * 0.0005, -time * 0.0003, time * 0.0004);
  float neb1 = fbm(nebulaPos * 1.2, 5);
  float neb2 = fbm(nebulaPos * 2.0 + 7.0, 4);

  // Only the brightest peaks show — most of the sky stays clean
  float nebulaMask = smoothstep(0.3, 0.6, neb1);
  vec3 nebulaColor = mix(
    vec3(0.04, 0.015, 0.06),
    vec3(0.015, 0.04, 0.08),
    smoothstep(-0.1, 0.3, neb2)
  );
  spaceColor += nebulaColor * nebulaMask * 0.2;

  // Faint warm emission in nebula peaks
  float emission = smoothstep(0.45, 0.65, neb2) * nebulaMask;
  spaceColor += vec3(0.06, 0.015, 0.02) * emission * 0.15;

  gl_FragColor = vec4(spaceColor, 1.0);
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
