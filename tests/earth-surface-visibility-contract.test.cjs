const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planetMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'PlanetMesh.tsx');
const planetMeshSource = fs.readFileSync(planetMeshPath, 'utf8');

test('Earth cloud layer stays subtle instead of overwhelming the surface texture', () => {
  assert.match(
    planetMeshSource,
    /<meshBasicMaterial[\s\S]*alphaMap=\{cloudsMap\}[\s\S]*opacity=\{0\.2\}/,
  );
});

test('Selection highlight does not use a wireframe overlay that hides texture detail', () => {
  assert.doesNotMatch(
    planetMeshSource,
    /wireframe/,
  );
});
