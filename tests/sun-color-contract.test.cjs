const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sunMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'SunMesh.tsx');
const sunMeshSource = fs.readFileSync(sunMeshPath, 'utf8');

test('SunMesh keeps the configured solar color even when a texture map is present', () => {
  assert.match(
    sunMeshSource,
    /<meshBasicMaterial[\s\S]*color=\{data\.color\}[\s\S]*map=\{colorMap \|\| null\}/,
  );
});
