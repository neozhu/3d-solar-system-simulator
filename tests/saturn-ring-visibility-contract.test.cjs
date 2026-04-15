const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planetMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'PlanetMesh.tsx');
const planetMeshSource = fs.readFileSync(planetMeshPath, 'utf8');

test('Saturn renders rings with a texture layer plus a separate lit shading layer', () => {
  assert.match(
    planetMeshSource,
    /data\.id === 'saturn'[\s\S]*<meshBasicMaterial[\s\S]*map=\{ringMap \|\| null\}[\s\S]*alphaMap=\{ringMap \|\| null\}[\s\S]*<meshStandardMaterial[\s\S]*transparent[\s\S]*blending=\{THREE\.MultiplyBlending\}/,
  );
});
