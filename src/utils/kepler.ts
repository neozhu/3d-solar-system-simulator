import * as THREE from 'three';
import { getScaledDistance } from './scaling';

export interface KeplerianElements {
  semiMajorAxisAU: number;
  eccentricity: number; // 0 = circular, 0 < e < 1 = elliptical
  inclinationDeg: number; // orbital plane tilt relative to ecliptic (degrees)
  longitudeOfAscendingNodeDeg?: number; // Ω (degrees)
  argumentOfPeriapsisDeg?: number; // ω (degrees)
  orbitalPeriodDays: number; // P (days)
}

/**
 * Solves Kepler's Equation M = E - e * sin(E) for Eccentric Anomaly E
 * using Newton-Raphson iteration.
 * @param M Mean Anomaly in radians
 * @param e Eccentricity (0 <= e < 1)
 */
export function solveKepler(M: number, e: number): number {
  // Normalize M to [0, 2PI)
  let m = M % (Math.PI * 2);
  if (m < 0) m += Math.PI * 2;

  // Initial guess
  let E = e > 0.8 ? Math.PI : m;
  const maxIterations = 15;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    const f = E - e * Math.sin(E) - m;
    if (Math.abs(f) < tolerance) break;
    const fPrime = 1 - e * Math.cos(E);
    E = E - f / fPrime;
  }

  return E;
}

/**
 * Calculates the 3D position (in scaled Three.js units) of a celestial body on its Keplerian orbit.
 * Coordinates are mapped to: X = ecliptic X, Y = orbital elevation (Z in standard astronomy), Z = ecliptic Y.
 */
export function calculateKeplerianPosition(
  elements: KeplerianElements,
  timeElapsedDays: number
): THREE.Vector3 {
  const {
    semiMajorAxisAU,
    eccentricity: e = 0,
    inclinationDeg = 0,
    longitudeOfAscendingNodeDeg = 0,
    argumentOfPeriapsisDeg = 0,
    orbitalPeriodDays
  } = elements;

  if (semiMajorAxisAU === 0 || orbitalPeriodDays === 0) {
    return new THREE.Vector3(0, 0, 0);
  }

  // Mean Anomaly M = 2PI * (t / P)
  const M = (timeElapsedDays / orbitalPeriodDays) * (Math.PI * 2);

  // Eccentric Anomaly E
  const E = solveKepler(M, e);

  // True Anomaly ν
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const trueAnomaly = Math.atan2(
    Math.sqrt(1 - e * e) * sinE,
    cosE - e
  );

  // Orbital distance r (in AU)
  const rAU = semiMajorAxisAU * (1 - e * cosE);

  // Scaled distance in scene units
  // Map AU to scaled distance using our existing non-linear scaling curve
  const scaledR = getScaledDistance(rAU);

  // Position in orbital plane (xOrb, zOrb)
  const xOrb = scaledR * Math.cos(trueAnomaly);
  const zOrb = scaledR * Math.sin(trueAnomaly);

  // Orbital angles in radians
  const inc = THREE.MathUtils.degToRad(inclinationDeg);
  const omega = THREE.MathUtils.degToRad(argumentOfPeriapsisDeg);
  const Omega = THREE.MathUtils.degToRad(longitudeOfAscendingNodeDeg);

  // Rotate in 3D: Periapsis rotation -> Inclination -> Ascending Node
  // In Three.js coordinates (X, Y=up, Z) where Y is perpendicular to ecliptic:
  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  const cosi = Math.cos(inc);
  const sini = Math.sin(inc);

  // Vector in the plane rotated by argument of periapsis
  const xP = xOrb * cosw - zOrb * sinw;
  const yP = xOrb * sinw + zOrb * cosw;

  // 3D coordinates in ecliptic frame (X, Y=up, Z)
  const x = xP * cosO - yP * cosi * sinO;
  const y = yP * sini; // elevation out of ecliptic plane
  const z = xP * sinO + yP * cosi * cosO;

  return new THREE.Vector3(x, y, z);
}

/**
 * Generates an array of Vector3 points representing the closed 3D elliptical orbit trajectory.
 */
export function generateKeplerianOrbitPoints(
  elements: KeplerianElements,
  segments: number = 180
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const {
    semiMajorAxisAU,
    eccentricity: e = 0,
    inclinationDeg = 0,
    longitudeOfAscendingNodeDeg = 0,
    argumentOfPeriapsisDeg = 0,
  } = elements;

  if (semiMajorAxisAU === 0) return points;

  const inc = THREE.MathUtils.degToRad(inclinationDeg);
  const omega = THREE.MathUtils.degToRad(argumentOfPeriapsisDeg);
  const Omega = THREE.MathUtils.degToRad(longitudeOfAscendingNodeDeg);

  const cosO = Math.cos(Omega);
  const sinO = Math.sin(Omega);
  const cosw = Math.cos(omega);
  const sinw = Math.sin(omega);
  const cosi = Math.cos(inc);
  const sini = Math.sin(inc);

  for (let i = 0; i <= segments; i++) {
    // Parameterize ellipse with Eccentric Anomaly E from 0 to 2PI
    const E = (i / segments) * Math.PI * 2;
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);

    // True Anomaly
    const trueAnomaly = Math.atan2(
      Math.sqrt(1 - e * e) * sinE,
      cosE - e
    );

    // Radius at this point
    const rAU = semiMajorAxisAU * (1 - e * cosE);
    const scaledR = getScaledDistance(rAU);

    const xOrb = scaledR * Math.cos(trueAnomaly);
    const zOrb = scaledR * Math.sin(trueAnomaly);

    const xP = xOrb * cosw - zOrb * sinw;
    const yP = xOrb * sinw + zOrb * cosw;

    const x = xP * cosO - yP * cosi * sinO;
    const y = yP * sini;
    const z = xP * sinO + yP * cosi * cosO;

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}
