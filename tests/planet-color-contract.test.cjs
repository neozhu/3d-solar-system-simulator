const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planetMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'PlanetMesh.tsx');
const planetMeshSource = fs.readFileSync(planetMeshPath, 'utf8');

test('PlanetMesh uses a neutral default tint for textured planets unless a texture-specific tint is provided', () => {
  assert.match(
    planetMeshSource,
    /const useTexturedSurface = !!colorMap;[\s\S]*\{useTexturedSurface \? \([\s\S]*<meshBasicMaterial[\s\S]*color=\{data\.textureColor \?\? '#ffffff'\}[\s\S]*map=\{colorMap \|\| null\}/,
  );
});

test('Non-textured planets still fall back to the lit standard material path', () => {
  assert.match(
    planetMeshSource,
    /: \(\s*<meshStandardMaterial[\s\S]*color=\{data\.color\}/,
  );
});

test('PlanetMesh keeps ring base color while a ring texture map is present', () => {
  assert.match(
    planetMeshSource,
    /<meshStandardMaterial[\s\S]*color=\{data\.color\}[\s\S]*map=\{ringMap \|\| null\}/,
  );
});
