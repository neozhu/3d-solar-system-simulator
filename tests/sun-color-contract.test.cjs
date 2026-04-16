const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sunMeshPath = path.join(__dirname, '..', 'src', 'components', 'scene', 'SunMesh.tsx');
const sunMeshSource = fs.readFileSync(sunMeshPath, 'utf8');

test('SunMesh keeps a neutral texture base color and disables tone mapping for solar texture readability', () => {
  assert.match(
    sunMeshSource,
    /<meshBasicMaterial[\s\S]*color=\{colorMap \? '#ffffff' : data\.color\}[\s\S]*map=\{colorMap \|\| null\}[\s\S]*toneMapped=\{false\}/,
  );
});

test('SunMesh adds a thin outer halo mesh instead of a billboard shader glow', () => {
  assert.match(
    sunMeshSource,
    /<mesh scale=\{1\.06\}>[\s\S]*<sphereGeometry args=\{\[scaledRadius, 64, 64\]\} \/>[\s\S]*<meshBasicMaterial[\s\S]*opacity=\{0\.08\}[\s\S]*blending=\{THREE\.AdditiveBlending\}[\s\S]*side=\{THREE\.BackSide\}/,
  );
});

test('SunMesh does not add a separate atmosphere shell that can wash out the solar texture', () => {
  assert.doesNotMatch(
    sunMeshSource,
    /<Atmosphere radius=\{scaledRadius \* 1\.\d+\} color="#ff3300" \/>/,
  );
});

test('SunMesh does not render a billboard glow layer over the textured solar core', () => {
  assert.doesNotMatch(
    sunMeshSource,
    /<Billboard>/,
  );
});
