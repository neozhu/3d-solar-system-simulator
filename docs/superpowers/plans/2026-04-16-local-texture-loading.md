# Local Texture Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all remote planet texture URLs with locally served static assets under `public/textures/`.

**Architecture:** Keep the existing `THREE.TextureLoader` usage unchanged and swap only the texture source strings. Add a contract test that enforces `/textures/...` URLs and checks that each referenced file exists in `public/textures/`, then download the assets and update the texture map to satisfy that contract.

**Tech Stack:** Vite, React, TypeScript, Three.js, Node.js contract tests

---

### Task 1: Add a local texture contract test

**Files:**
- Create: `tests/local-texture-contract.test.cjs`
- Modify: none
- Test: `tests/local-texture-contract.test.cjs`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function loadSolarSystemDataModuleSource() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'solarSystemData.ts');
  return fs.readFileSync(filePath, 'utf8');
}

function collectTextureUrls(source) {
  const textureMapMatch = source.match(/const textureMap = \{([\s\S]*?)\n\};/);
  assert.ok(textureMapMatch, 'textureMap should exist');

  const entryRegex = /([a-zA-Z]+): '([^']+)'/g;
  const entries = new Map();
  let match;

  while ((match = entryRegex.exec(textureMapMatch[1])) !== null) {
    entries.set(match[1], match[2]);
  }

  return [...entries.values()];
}

test('texture map uses local /textures URLs only', () => {
  const source = loadSolarSystemDataModuleSource();
  const urls = collectTextureUrls(source);

  assert.ok(urls.length > 0, 'expected texture URLs to be defined');

  for (const url of urls) {
    assert.match(url, /^\/textures\//);
    assert.doesNotMatch(url, /^https?:\/\//);
  }
});

test('every local texture URL points to an existing file in public/textures', () => {
  const source = loadSolarSystemDataModuleSource();
  const urls = collectTextureUrls(source);

  for (const url of urls) {
    const relativePath = url.replace(/^\//, '');
    const filePath = path.join(process.cwd(), 'public', relativePath);
    assert.ok(fs.existsSync(filePath), `missing local texture file: ${filePath}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/local-texture-contract.test.cjs`
Expected: FAIL because the current `textureMap` still contains `https://upload.wikimedia.org/...` URLs and the local file checks do not pass.

- [ ] **Step 3: Commit**

```bash
git add tests/local-texture-contract.test.cjs
git commit -m "test: add local texture asset contract"
```

### Task 2: Download the texture assets into the public directory

**Files:**
- Create: `public/textures/sun.jpg`
- Create: `public/textures/mercury.jpg`
- Create: `public/textures/venus.jpg`
- Create: `public/textures/earth.jpg`
- Create: `public/textures/earth-clouds.jpg`
- Create: `public/textures/mars.jpg`
- Create: `public/textures/jupiter.jpg`
- Create: `public/textures/saturn.jpg`
- Create: `public/textures/saturn-ring.png`
- Create: `public/textures/uranus.jpg`
- Create: `public/textures/neptune.jpg`
- Modify: none
- Test: `tests/local-texture-contract.test.cjs`

- [ ] **Step 1: Download the texture files into `public/textures/`**

Run:

```powershell
New-Item -ItemType Directory -Path public/textures -Force | Out-Null
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/c/cb/Solarsystemscope_texture_2k_sun.jpg" -OutFile "public/textures/sun.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/9/92/Solarsystemscope_texture_2k_mercury.jpg" -OutFile "public/textures/mercury.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/4/40/Solarsystemscope_texture_2k_venus_surface.jpg" -OutFile "public/textures/venus.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/c/c3/Solarsystemscope_texture_2k_earth_daymap.jpg" -OutFile "public/textures/earth.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/e/ed/Solarsystemscope_texture_2k_earth_clouds.jpg" -OutFile "public/textures/earth-clouds.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/4/46/Solarsystemscope_texture_2k_mars.jpg" -OutFile "public/textures/mars.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/b/be/Solarsystemscope_texture_2k_jupiter.jpg" -OutFile "public/textures/jupiter.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/e/ea/Solarsystemscope_texture_2k_saturn.jpg" -OutFile "public/textures/saturn.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/7/7d/Solarsystemscope_texture_2k_saturn_ring_alpha.png" -OutFile "public/textures/saturn-ring.png"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/9/95/Solarsystemscope_texture_2k_uranus.jpg" -OutFile "public/textures/uranus.jpg"
Invoke-WebRequest -Uri "https://upload.wikimedia.org/wikipedia/commons/1/1e/Solarsystemscope_texture_2k_neptune.jpg" -OutFile "public/textures/neptune.jpg"
```

- [ ] **Step 2: Commit**

```bash
git add public/textures
git commit -m "chore: add local planet texture assets"
```

### Task 3: Switch the texture map to local URLs

**Files:**
- Modify: `src/data/solarSystemData.ts`
- Test: `tests/local-texture-contract.test.cjs`

- [ ] **Step 1: Write the minimal implementation**

Replace the `textureMap` definition with:

```ts
const textureMap = {
  sun: '/textures/sun.jpg',
  mercury: '/textures/mercury.jpg',
  venus: '/textures/venus.jpg',
  earth: '/textures/earth.jpg',
  earthClouds: '/textures/earth-clouds.jpg',
  mars: '/textures/mars.jpg',
  jupiter: '/textures/jupiter.jpg',
  saturn: '/textures/saturn.jpg',
  saturnRing: '/textures/saturn-ring.png',
  uranus: '/textures/uranus.jpg',
  neptune: '/textures/neptune.jpg'
};
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test tests/local-texture-contract.test.cjs`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/data/solarSystemData.ts
git commit -m "feat: load planet textures from local static assets"
```

### Task 4: Verify the app still builds

**Files:**
- Modify: none
- Test: `package.json`

- [ ] **Step 1: Run the full build**

Run: `npm run build`
Expected: successful TypeScript compile and Vite production build with no texture-loading code changes required.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-16-local-texture-design.md docs/superpowers/plans/2026-04-16-local-texture-loading.md
git commit -m "docs: add local texture loading spec and plan"
```
