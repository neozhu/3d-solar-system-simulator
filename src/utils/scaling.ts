// Physical Scaling Strategy:
// To make the solar system viewable and aesthetically pleasing in a 3D scene,
// true 1:1 scale cannot be used. 

const BASE_EARTH_RADIUS = 1; // Earth's size in Three.js units
const BASE_DISTANCE_AU = 15; // 1 AU in Three.js units

// Adjust size. Gas giants are scaled down slightly, Sun is scaled down significantly.
export const getScaledRadius = (realRadiusKm: number, id: string): number => {
  if (id === 'sun') {
    return BASE_EARTH_RADIUS * 15; // Sun is huge but we cap it so it doesn't eclipse inner planets
  }
  
  const scaleRatio = realRadiusKm / 6371.0; // Ratio to Earth
  
  if (scaleRatio > 5) {
    // Gas giant scaling (compress scale)
    return BASE_EARTH_RADIUS * (3 + Math.log2(scaleRatio));
  }
  
  return BASE_EARTH_RADIUS * scaleRatio;
};

// Distance scaling
// Mercury is 0.38 AU, Neptune is 30 AU.
// We'll use a compressed scale for the outer planets so the camera doesn't have to zoom miles out.
export const getScaledDistance = (distanceAU: number): number => {
  if (distanceAU === 0) return 0;
  
  // A gentle logarithmic compression for distance
  const compressedAU = Math.pow(distanceAU, 0.6);
  
  // Ensure the sun's surface doesn't swallow inner planets (Sun radius is 15)
  const MIN_DISTANCE_OFFSET = 20; 
  
  return MIN_DISTANCE_OFFSET + (compressedAU * BASE_DISTANCE_AU);
};

export const getScaledSatelliteDistance = (distanceAU: number): number => {
  if (distanceAU === 0) return 0;
  // Reduce satellite distance so the orbit doesn't cross into neighboring planets' paths.
  // 0.1 AU -> 2.0 units away from center (Earth radius is ~1 unit)
  return distanceAU * 20; 
};

// Returns angle in radians for orbital position
export const calculateOrbitalAngle = (periodDays: number, timeElapsedDays: number): number => {
  if (periodDays === 0) return 0;
  // Full circle (2PI) completed every periodDays
  return (timeElapsedDays / periodDays) * (Math.PI * 2);
};

// Returns angle in radians for planet self-rotation
export const calculateRotationAngle = (rotationPeriodDays: number, timeElapsedDays: number): number => {
  if (rotationPeriodDays === 0) return 0;
  return (timeElapsedDays / rotationPeriodDays) * (Math.PI * 2);
};
