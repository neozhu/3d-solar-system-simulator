const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const planetMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'PlanetMesh.tsx');
const solarSystemDataPath = path.join(__dirname, '..', 'src', 'data', 'solarSystemData.ts');

const planetMeshSource = fs.readFileSync(planetMeshPath, 'utf8');
const solarSystemDataSource = fs.readFileSync(solarSystemDataPath, 'utf8');

test('PlanetMesh allows textured planets to override the texture tint color', () => {
  assert.match(
    planetMeshSource,
    /color=\{colorMap \? \(data\.textureColor \?\? data\.color\) : data\.color\}/,
  );
});

test('Earth uses a neutral texture tint so land remains visible', () => {
  assert.match(
    solarSystemDataSource,
    /id: "earth"[\s\S]*textureColor: "#ffffff"/,
  );
});
