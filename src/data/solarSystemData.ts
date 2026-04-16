export interface PlanetData {
  id: string;
  name: string;
  radiusKm: number;
  distanceFromSunAU: number; 
  orbitalPeriodDays: number;
  rotationPeriodDays: number;
  axialTiltDegrees: number;
  color: string;
  description: string;
  hasRings?: boolean;
  textureUrl?: string;       // Color Map
  ringTextureUrl?: string;   // Ring color/alpha
  bumpMapUrl?: string;       // Elevation/Bump map
  specularMapUrl?: string;   // Specular/Roughness map
  cloudsMapUrl?: string;     // Cloud layer map
  textureColor?: string;     // Optional tint for the color map
  hasAtmosphere?: boolean;
}

const textureBaseUrl = `${import.meta.env.BASE_URL}textures`;

const textureMap = {
  sun: `${textureBaseUrl}/sun.jpg`,
  mercury: `${textureBaseUrl}/mercury.jpg`,
  venus: `${textureBaseUrl}/venus.jpg`,
  earth: `${textureBaseUrl}/earth.jpg`,
  earthClouds: `${textureBaseUrl}/earth-clouds.jpg`,
  mars: `${textureBaseUrl}/mars.jpg`,
  jupiter: `${textureBaseUrl}/jupiter.jpg`,
  saturn: `${textureBaseUrl}/saturn.jpg`,
  saturnRing: `${textureBaseUrl}/saturn-ring.png`,
  uranus: `${textureBaseUrl}/uranus.jpg`,
  neptune: `${textureBaseUrl}/neptune.jpg`
};

// Data approximation for visualization. 
// Uses real AU and real periods, but actual distances will be scaled using our scaling functions.
export const solarSystemData: PlanetData[] = [
  {
    id: "sun",
    name: "Sun",
    radiusKm: 696340,
    distanceFromSunAU: 0,
    orbitalPeriodDays: 1, // Doesn't orbit
    rotationPeriodDays: 27,
    axialTiltDegrees: 7.25,
    color: "#ffcc00",
    textureUrl: textureMap.sun,
    description: "The star at the center of the Solar System. It is a nearly perfect ball of hot plasma, heated to incandescence by nuclear fusion reactions in its core."
  },
  {
    id: "mercury",
    name: "Mercury",
    radiusKm: 2439.7,
    distanceFromSunAU: 0.387,
    orbitalPeriodDays: 88.0,
    rotationPeriodDays: 58.6,
    axialTiltDegrees: 0.034,
    color: "#a8a8a8",
    textureUrl: textureMap.mercury,
    hasAtmosphere: false,
    description: "The smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, the shortest of all the Sun's planets."
  },
  {
    id: "venus",
    name: "Venus",
    radiusKm: 6051.8,
    distanceFromSunAU: 0.723,
    orbitalPeriodDays: 224.7,
    rotationPeriodDays: -243.0, // Retrograde
    axialTiltDegrees: 177.4,
    color: "#e3bb76",
    textureUrl: textureMap.venus,
    hasAtmosphere: true,
    description: "The second planet from the Sun. It is a terrestrial planet and is sometimes called Earth's 'sister planet' because of their similar size, mass, proximity to the Sun, and bulk composition."
  },
  {
    id: "earth",
    name: "Earth",
    radiusKm: 6371.0,
    distanceFromSunAU: 1.0,
    orbitalPeriodDays: 365.2,
    rotationPeriodDays: 1.0,
    axialTiltDegrees: 23.44,
    color: "#4b9fe3",
    textureColor: "#ffffff",
    textureUrl: textureMap.earth,
    cloudsMapUrl: textureMap.earthClouds,
    hasAtmosphere: true,
    description: "Our home planet is the third planet from the Sun, and the only place we know of so far that's inhabited by living things."
  },
  {
    id: "mars",
    name: "Mars",
    radiusKm: 3389.5,
    distanceFromSunAU: 1.524,
    orbitalPeriodDays: 687.0,
    rotationPeriodDays: 1.03,
    axialTiltDegrees: 25.19,
    color: "#e27b58",
    textureColor: "#b15c3b",
    textureUrl: textureMap.mars,
    hasAtmosphere: true,
    description: "The fourth planet from the Sun – a dusty, cold, desert world with a very thin atmosphere. Mars is also a dynamic planet with seasons, polar ice caps, canyons, extinct volcanoes, and evidence that it was even more active in the past."
  },
  {
    id: "jupiter",
    name: "Jupiter",
    radiusKm: 69911,
    distanceFromSunAU: 5.203,
    orbitalPeriodDays: 4331,
    rotationPeriodDays: 0.41,
    axialTiltDegrees: 3.13,
    color: "#c99a7b",
    textureUrl: textureMap.jupiter,
    description: "The largest planet in our solar system – if it were a hollow shell, 1,000 Earths could fit inside. It is a gas giant with a mass more than two and a half times that of all the other planets in the Solar System combined."
  },
  {
    id: "saturn",
    name: "Saturn",
    radiusKm: 58232,
    distanceFromSunAU: 9.537,
    orbitalPeriodDays: 10747,
    rotationPeriodDays: 0.45,
    axialTiltDegrees: 26.73,
    color: "#ead6b8",
    textureUrl: textureMap.saturn,
    hasRings: true,
    ringTextureUrl: textureMap.saturnRing,
    description: "The sixth planet from the Sun and the second-largest in the Solar System, after Jupiter. It is a gas giant with an average radius of about nine and a half times that of Earth. Adorned with a dazzling, complex system of icy rings."
  },
  {
    id: "uranus",
    name: "Uranus",
    radiusKm: 25362,
    distanceFromSunAU: 19.191,
    orbitalPeriodDays: 30589,
    rotationPeriodDays: -0.72,
    axialTiltDegrees: 97.77,
    color: "#73d7df",
    textureUrl: textureMap.uranus,
    description: "The seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System. Uranus revolves on its side, rolling like a barrel rather than spinning like a top."
  },
  {
    id: "neptune",
    name: "Neptune",
    radiusKm: 24622,
    distanceFromSunAU: 30.069,
    orbitalPeriodDays: 59800,
    rotationPeriodDays: 0.67,
    axialTiltDegrees: 28.32,
    color: "#4b70dd",
    textureUrl: textureMap.neptune,
    description: "The eighth and farthest-known Solar planet from the Sun. In the Solar System, it is the fourth-largest planet by diameter, the third-most-massive planet, and the densest giant planet."
  }
];
