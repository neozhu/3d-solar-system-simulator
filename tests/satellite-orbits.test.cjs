const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Exercise the actual TypeScript math without adding a test runner dependency.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  module._compile(outputText, filename);
};

const { getScaledRadius, getScaledSatelliteDistance } = require('../src/utils/scaling.ts');
const { calculateKeplerianPosition, generateKeplerianOrbitPoints } = require('../src/utils/kepler.ts');

test('satellite orbits clear their parent surface and remain distinct', () => {
  const jupiterRadius = getScaledRadius(69911, 'jupiter');
  const radii = [0.05, 0.08, 0.12, 0.16].map(distance =>
    getScaledSatelliteDistance(distance, jupiterRadius)
  );
  assert.ok(radii[0] > jupiterRadius + 0.5, 'Inner moon must clear Jupiter');
  for (let i = 1; i < radii.length; i++) {
    assert.ok(radii[i] - radii[i - 1] > 0.8, 'Moon orbits must not collapse together');
  }
});

test('Saturn satellites orbit beyond the visible rings', () => {
  const saturnRadius = getScaledRadius(58232, 'saturn');
  const innerOrbit = getScaledSatelliteDistance(0.05, saturnRadius, true);
  assert.ok(innerOrbit > saturnRadius * 2.5 + 0.5, 'Inner moon must clear the outer ring');
});

test('satellite position uses the local distance scale and follows its inclined orbit line', () => {
  const elements = {
    semiMajorAxisAU: 0.08,
    eccentricity: 0,
    inclinationDeg: 30,
    longitudeOfAscendingNodeDeg: 25,
    argumentOfPeriapsisDeg: 15,
    orbitalPeriodDays: 20,
  };
  const scaleDistance = distance => getScaledSatelliteDistance(distance, 1);
  const points = generateKeplerianOrbitPoints(elements, 64, scaleDistance);
  for (const [time, pointIndex] of [[0, 0], [5, 16], [10, 32], [15, 48]]) {
    const position = calculateKeplerianPosition(elements, time, scaleDistance);
    assert.ok(position.length() < 8, 'Moon must stay near Earth instead of using the solar orbit offset');
    assert.ok(position.distanceTo(points[pointIndex]) < 1e-6, 'Mesh must lie on its displayed orbit');
  }
  assert.ok(points[0].distanceTo(points[64]) < 1e-6, 'Orbit must close');
});
