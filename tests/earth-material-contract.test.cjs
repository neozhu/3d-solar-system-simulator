const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planetMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'PlanetMesh.tsx');
const planetMeshSource = fs.readFileSync(planetMeshPath, 'utf8');

test('Earth uses the layered surface path so its daymap remains visible under the sun light', () => {
  assert.match(
    planetMeshSource,
    /data\.id === 'earth' \|\| data\.id === 'mars'[\s\S]*useLayeredSurface[\s\S]*<meshBasicMaterial[\s\S]*map=\{colorMap \|\| null\}[\s\S]*<meshStandardMaterial[\s\S]*blending=\{THREE\.MultiplyBlending\}/,
  );
});

test('Mars also uses the layered surface path so texture detail and day-night shading coexist', () => {
  assert.match(
    planetMeshSource,
    /data\.id === 'earth' \|\| data\.id === 'mars'[\s\S]*useLayeredSurface[\s\S]*<meshBasicMaterial[\s\S]*map=\{colorMap \|\| null\}[\s\S]*<meshStandardMaterial[\s\S]*blending=\{THREE\.MultiplyBlending\}/,
  );
});
