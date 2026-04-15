const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planetMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'PlanetMesh.tsx');
const planetMeshSource = fs.readFileSync(planetMeshPath, 'utf8');

test('PlanetMesh uses either a texture-specific tint or the planet base color for textured planets', () => {
  assert.match(
    planetMeshSource,
    /<meshStandardMaterial[\s\S]*color=\{colorMap \? \(data\.textureColor \?\? data\.color\) : data\.color\}[\s\S]*map=\{colorMap \|\| null\}/,
  );
});

test('PlanetMesh keeps ring base color while a ring texture map is present', () => {
  assert.match(
    planetMeshSource,
    /<meshStandardMaterial[\s\S]*color=\{data\.color\}[\s\S]*map=\{ringMap \|\| null\}/,
  );
});
