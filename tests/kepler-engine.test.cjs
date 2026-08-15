const test = require('node:test');
const assert = require('node:assert/strict');

// Kepler calculation logic validation
function solveKepler(M, e) {
  let m = M % (Math.PI * 2);
  if (m < 0) m += Math.PI * 2;
  let E = e > 0.8 ? Math.PI : m;
  for (let i = 0; i < 15; i++) {
    const f = E - e * Math.sin(E) - m;
    if (Math.abs(f) < 1e-6) break;
    const fPrime = 1 - e * Math.cos(E);
    E = E - f / fPrime;
  }
  return E;
}

test('Kepler equation solver accurately handles circular and highly eccentric orbits', () => {
  // Circular orbit e=0
  const E_circ = solveKepler(Math.PI / 2, 0);
  assert.ok(Math.abs(E_circ - Math.PI / 2) < 1e-5, 'Circular orbit Eccentric Anomaly should equal Mean Anomaly');

  // Mercury e=0.2056
  const E_merc = solveKepler(Math.PI / 3, 0.2056);
  const diff_merc = E_merc - 0.2056 * Math.sin(E_merc) - Math.PI / 3;
  assert.ok(Math.abs(diff_merc) < 1e-5, 'Mercury orbit should satisfy M = E - e*sin(E)');

  // Halley's comet extreme eccentricity e=0.967
  const E_halley = solveKepler(Math.PI / 4, 0.967);
  const diff_halley = E_halley - 0.967 * Math.sin(E_halley) - Math.PI / 4;
  assert.ok(Math.abs(diff_halley) < 1e-5, 'Halley extreme orbit should satisfy M = E - e*sin(E)');
});
