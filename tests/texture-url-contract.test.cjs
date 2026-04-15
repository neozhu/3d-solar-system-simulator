const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const solarSystemDataPath = path.join(__dirname, '..', 'src', 'data', 'solarSystemData.ts');
const solarSystemDataSource = fs.readFileSync(solarSystemDataPath, 'utf8');

test('planet texture sources use direct upload.wikimedia asset URLs', () => {
  assert.doesNotMatch(
    solarSystemDataSource,
    /https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//,
  );

  assert.match(
    solarSystemDataSource,
    /https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//,
  );
});
