const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planetMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'PlanetMesh.tsx');
const planetMeshSource = fs.readFileSync(planetMeshPath, 'utf8');

test('PlanetMesh uses a day/night terminator shader for textured planets', () => {
  assert.match(
    planetMeshSource,
    /dayNightFragmentShader/,
    'Expected PlanetMesh to use dayNightFragmentShader'
  );
  assert.match(
    planetMeshSource,
    /uDayMap/,
    'Expected shader to sample uDayMap'
  );
});

test('PlanetMesh implements Saturn ring shadow shader', () => {
  assert.match(
    planetMeshSource,
    /ringFragmentShader/,
    'Expected PlanetMesh to use ringFragmentShader'
  );
  assert.match(
    planetMeshSource,
    /uPlanetRadius/,
    'Expected ring shader to receive planet radius for shadow calculation'
  );
});
