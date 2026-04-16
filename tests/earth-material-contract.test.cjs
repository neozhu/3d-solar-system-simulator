const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planetMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'PlanetMesh.tsx');
const planetMeshSource = fs.readFileSync(planetMeshPath, 'utf8');

test('Only Earth and Mars use the layered lighting overlay on top of their base texture', () => {
  assert.match(
    planetMeshSource,
    /const useLayeredLighting = \(data\.id === 'earth' \|\| data\.id === 'mars'\) && !!colorMap;[\s\S]*<meshBasicMaterial[\s\S]*color=\{data\.textureColor \?\? '#ffffff'\}[\s\S]*map=\{colorMap \|\| null\}[\s\S]*\{useLayeredLighting && \(/,
  );
});

test('The layered lighting overlay stays white and multiply-blended so only Earth and Mars get shading detail', () => {
  assert.match(
    planetMeshSource,
    /<meshStandardMaterial[\s\S]*color="#ffffff"[\s\S]*blending=\{THREE\.MultiplyBlending\}/,
  );
});
