export interface PlanetData {
  id: string;
  name: string;
  category: 'star' | 'planet' | 'dwarf' | 'moon' | 'comet';
  radiusKm: number;
  distanceFromSunAU: number; // semi-major axis a (AU)
  orbitalPeriodDays: number;
  rotationPeriodDays: number;
  axialTiltDegrees: number;
  eccentricity?: number;
  inclinationDeg?: number;
  longitudeOfAscendingNodeDeg?: number;
  argumentOfPeriapsisDeg?: number;
  color: string;
  description: string;
  hasRings?: boolean;
  textureUrl?: string; // Color Map
  ringTextureUrl?: string; // Ring color/alpha
  bumpMapUrl?: string; // Elevation/Bump map
  specularMapUrl?: string; // Specular/Roughness map
  cloudsMapUrl?: string; // Cloud layer map
  textureColor?: string; // Optional tint for the color map
  hasAtmosphere?: boolean;
  satellites?: PlanetData[]; // Moons orbiting the planet
  isTidallyLocked?: boolean;
}

const textureBaseUrl = `${import.meta.env.BASE_URL}textures`;

const textureMap = {
  sun: `${textureBaseUrl}/sun.jpg`,
  mercury: `${textureBaseUrl}/mercury.jpg`,
  venus: `${textureBaseUrl}/venus.jpg`,
  earth: `${textureBaseUrl}/earth.jpg`,
  earthClouds: `${textureBaseUrl}/earth-clouds.jpg`,
  moon: `${textureBaseUrl}/moon.png`,
  mars: `${textureBaseUrl}/mars.jpg`,
  jupiter: `${textureBaseUrl}/jupiter.jpg`,
  saturn: `${textureBaseUrl}/saturn.jpg`,
  saturnRing: `${textureBaseUrl}/saturn-ring.png`,
  uranus: `${textureBaseUrl}/uranus.jpg`,
  neptune: `${textureBaseUrl}/neptune.jpg`
};

export const solarSystemData: PlanetData[] = [
  {
    id: "sun",
    name: "Sun",
    category: "star",
    radiusKm: 696340,
    distanceFromSunAU: 0,
    orbitalPeriodDays: 1, // Doesn't orbit
    rotationPeriodDays: 27,
    axialTiltDegrees: 7.25,
    eccentricity: 0,
    inclinationDeg: 0,
    color: "#ffcc00",
    textureUrl: textureMap.sun,
    description: "The G-type main-sequence star at the center of our Solar System, accounting for 99.86% of the system's total mass."
  },
  {
    id: "mercury",
    name: "Mercury",
    category: "planet",
    radiusKm: 2439.7,
    distanceFromSunAU: 0.387,
    orbitalPeriodDays: 88.0,
    rotationPeriodDays: 58.6,
    axialTiltDegrees: 0.034,
    eccentricity: 0.2056, // Highly eccentric
    inclinationDeg: 7.0,  // Significant inclination
    longitudeOfAscendingNodeDeg: 48.33,
    argumentOfPeriapsisDeg: 29.12,
    color: "#a8a8a8",
    textureUrl: textureMap.mercury,
    hasAtmosphere: false,
    description: "The smallest planet in the Solar System and closest to the Sun. Its orbit is the most eccentric of all planets."
  },
  {
    id: "venus",
    name: "Venus",
    category: "planet",
    radiusKm: 6051.8,
    distanceFromSunAU: 0.723,
    orbitalPeriodDays: 224.7,
    rotationPeriodDays: -243.0, // Retrograde
    axialTiltDegrees: 177.4,
    eccentricity: 0.0067,
    inclinationDeg: 3.39,
    longitudeOfAscendingNodeDeg: 76.68,
    argumentOfPeriapsisDeg: 54.88,
    color: "#e3bb76",
    textureUrl: textureMap.venus,
    hasAtmosphere: true,
    description: "The hottest planet in the Solar System, enveloped by dense sulfuric acid clouds generating a runaway greenhouse effect."
  },
  {
    id: "earth",
    name: "Earth",
    category: "planet",
    radiusKm: 6371.0,
    distanceFromSunAU: 1.0,
    orbitalPeriodDays: 365.25,
    rotationPeriodDays: 1.0,
    axialTiltDegrees: 23.44,
    eccentricity: 0.0167,
    inclinationDeg: 0.0, // Base reference plane (ecliptic)
    longitudeOfAscendingNodeDeg: 0.0,
    argumentOfPeriapsisDeg: 114.21,
    color: "#4b9fe3",
    textureColor: "#ffffff",
    textureUrl: textureMap.earth,
    cloudsMapUrl: textureMap.earthClouds,
    hasAtmosphere: true,
    satellites: [
      {
        id: "moon",
        name: "Moon",
        category: "moon",
        radiusKm: 1737.4,
        distanceFromSunAU: 0.08,
        orbitalPeriodDays: 27.3,
        rotationPeriodDays: 27.3,
        axialTiltDegrees: 1.54,
        eccentricity: 0.0549,
        inclinationDeg: 5.14,
        color: "#d1d5db",
        textureUrl: textureMap.moon,
        isTidallyLocked: true,
        description: "Earth's sole natural satellite, in synchronous rotation stabilizing Earth's axial wobble."
      }
    ],
    description: "Our home planet, the only celestial body known to harbor active oceans, plate tectonics, and thriving life."
  },
  {
    id: "mars",
    name: "Mars",
    category: "planet",
    radiusKm: 3389.5,
    distanceFromSunAU: 1.524,
    orbitalPeriodDays: 687.0,
    rotationPeriodDays: 1.03,
    axialTiltDegrees: 25.19,
    eccentricity: 0.0934,
    inclinationDeg: 1.85,
    longitudeOfAscendingNodeDeg: 49.56,
    argumentOfPeriapsisDeg: 286.5,
    color: "#e27b58",
    textureColor: "#b15c3b",
    textureUrl: textureMap.mars,
    hasAtmosphere: true,
    satellites: [
      {
        id: "phobos",
        name: "Phobos",
        category: "moon",
        radiusKm: 11.2,
        distanceFromSunAU: 0.04,
        orbitalPeriodDays: 0.32,
        rotationPeriodDays: 0.32,
        axialTiltDegrees: 0,
        color: "#948f87",
        isTidallyLocked: true,
        description: "The larger and inner of Mars' two irregularly shaped, heavily cratered captured moons."
      },
      {
        id: "deimos",
        name: "Deimos",
        category: "moon",
        radiusKm: 6.2,
        distanceFromSunAU: 0.07,
        orbitalPeriodDays: 1.26,
        rotationPeriodDays: 1.26,
        axialTiltDegrees: 0,
        color: "#b0aba2",
        isTidallyLocked: true,
        description: "The outer, smaller moon of Mars, covered in a thick layer of regolith."
      }
    ],
    description: "The Red Planet, featuring the solar system's tallest volcano (Olympus Mons) and deepest canyon (Valles Marineris)."
  },
  {
    id: "jupiter",
    name: "Jupiter",
    category: "planet",
    radiusKm: 69911,
    distanceFromSunAU: 5.203,
    orbitalPeriodDays: 4332.6,
    rotationPeriodDays: 0.41,
    axialTiltDegrees: 3.13,
    eccentricity: 0.0484,
    inclinationDeg: 1.3,
    longitudeOfAscendingNodeDeg: 100.49,
    argumentOfPeriapsisDeg: 273.87,
    color: "#c99a7b",
    textureUrl: textureMap.jupiter,
    satellites: [
      {
        id: "io",
        name: "Io",
        category: "moon",
        radiusKm: 1821.6,
        distanceFromSunAU: 0.05,
        orbitalPeriodDays: 1.77,
        rotationPeriodDays: 1.77,
        axialTiltDegrees: 0,
        color: "#e6c843",
        isTidallyLocked: true,
        description: "The most geologically active body in the Solar System, with hundreds of erupting sulfur volcanoes."
      },
      {
        id: "europa",
        name: "Europa",
        category: "moon",
        radiusKm: 1560.8,
        distanceFromSunAU: 0.08,
        orbitalPeriodDays: 3.55,
        rotationPeriodDays: 3.55,
        axialTiltDegrees: 0,
        color: "#c8d0db",
        isTidallyLocked: true,
        description: "An ice-crusted moon harboring a vast subsurface liquid water ocean with more water than all of Earth's oceans."
      },
      {
        id: "ganymede",
        name: "Ganymede",
        category: "moon",
        radiusKm: 2634.1,
        distanceFromSunAU: 0.12,
        orbitalPeriodDays: 7.15,
        rotationPeriodDays: 7.15,
        axialTiltDegrees: 0,
        color: "#998b7e",
        isTidallyLocked: true,
        description: "The largest moon in the Solar System (even larger than Mercury), with its own generated magnetic field."
      },
      {
        id: "callisto",
        name: "Callisto",
        category: "moon",
        radiusKm: 2410.3,
        distanceFromSunAU: 0.16,
        orbitalPeriodDays: 16.69,
        rotationPeriodDays: 16.69,
        axialTiltDegrees: 0,
        color: "#6c6660",
        isTidallyLocked: true,
        description: "The most heavily cratered object in the Solar System, an ancient pristine frozen world."
      }
    ],
    description: "The dominant gas giant holding more than twice the mass of all other planets combined, with iconic stormy bands and the Great Red Spot."
  },
  {
    id: "saturn",
    name: "Saturn",
    category: "planet",
    radiusKm: 58232,
    distanceFromSunAU: 9.537,
    orbitalPeriodDays: 10759.2,
    rotationPeriodDays: 0.45,
    axialTiltDegrees: 26.73,
    eccentricity: 0.0541,
    inclinationDeg: 2.49,
    longitudeOfAscendingNodeDeg: 113.67,
    argumentOfPeriapsisDeg: 339.39,
    color: "#ead6b8",
    textureUrl: textureMap.saturn,
    hasRings: true,
    ringTextureUrl: textureMap.saturnRing,
    satellites: [
      {
        id: "titan",
        name: "Titan",
        category: "moon",
        radiusKm: 2574.7,
        distanceFromSunAU: 0.10,
        orbitalPeriodDays: 15.95,
        rotationPeriodDays: 15.95,
        axialTiltDegrees: 0,
        color: "#d4a459",
        isTidallyLocked: true,
        description: "The second-largest moon in the solar system, surrounded by a dense nitrogen atmosphere and liquid methane/ethane lakes."
      },
      {
        id: "enceladus",
        name: "Enceladus",
        category: "moon",
        radiusKm: 252.1,
        distanceFromSunAU: 0.05,
        orbitalPeriodDays: 1.37,
        rotationPeriodDays: 1.37,
        axialTiltDegrees: 0,
        color: "#eef4fa",
        isTidallyLocked: true,
        description: "An icy moon shooting cryovolcanic water vapor geysers into space from its south polar 'tiger stripe' fractures."
      }
    ],
    description: "Famous for its dazzling, extensive icy ring system spanning hundreds of thousands of kilometers."
  },
  {
    id: "uranus",
    name: "Uranus",
    category: "planet",
    radiusKm: 25362,
    distanceFromSunAU: 19.191,
    orbitalPeriodDays: 30685.4,
    rotationPeriodDays: -0.72,
    axialTiltDegrees: 97.77,
    eccentricity: 0.0472,
    inclinationDeg: 0.77,
    longitudeOfAscendingNodeDeg: 74.01,
    argumentOfPeriapsisDeg: 96.99,
    color: "#73d7df",
    textureUrl: textureMap.uranus,
    description: "An ice giant tilted sideways at 98 degrees, rotating almost perpendicular to its orbital plane."
  },
  {
    id: "neptune",
    name: "Neptune",
    category: "planet",
    radiusKm: 24622,
    distanceFromSunAU: 30.069,
    orbitalPeriodDays: 60189.0,
    rotationPeriodDays: 0.67,
    axialTiltDegrees: 28.32,
    eccentricity: 0.0086,
    inclinationDeg: 1.77,
    longitudeOfAscendingNodeDeg: 131.78,
    argumentOfPeriapsisDeg: 273.19,
    color: "#4b70dd",
    textureUrl: textureMap.neptune,
    description: "The outermost known major planet, a deep azure world enduring supersonic winds reaching over 2,100 km/h."
  },
  {
    id: "pluto",
    name: "Pluto",
    category: "dwarf",
    radiusKm: 1188.3,
    distanceFromSunAU: 39.482,
    orbitalPeriodDays: 90560,
    rotationPeriodDays: -6.39,
    axialTiltDegrees: 122.53,
    eccentricity: 0.2488, // Highly eccentric orbit crossing Neptune's distance
    inclinationDeg: 17.16, // High inclination
    longitudeOfAscendingNodeDeg: 110.30,
    argumentOfPeriapsisDeg: 113.83,
    color: "#c29d7d",
    description: "The most famous dwarf planet in the Kuiper Belt, sporting a high orbital inclination and a heart-shaped nitrogen glacier (Tombaugh Regio)."
  },
  {
    id: "halley",
    name: "1P/Halley",
    category: "comet",
    radiusKm: 5.5,
    distanceFromSunAU: 17.834,
    orbitalPeriodDays: 27500, // ~75.3 Earth years
    rotationPeriodDays: 2.2,
    axialTiltDegrees: 18.0,
    eccentricity: 0.967, // Extreme ellipse
    inclinationDeg: 17.8,
    longitudeOfAscendingNodeDeg: 58.42,
    argumentOfPeriapsisDeg: 111.33,
    color: "#a0e6ff",
    description: "The famous periodic comet visible from Earth every 75–76 years. Its orbit takes it from inside Venus's orbit out beyond Neptune."
  }
];
