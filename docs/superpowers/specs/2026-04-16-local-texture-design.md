# Local Texture Loading Design

**Goal**

Download the existing remote planet texture assets into the repository and load them through local static URLs instead of Wikimedia-hosted URLs.

**Scope**

- Add a local static texture directory under `public/textures/`.
- Store the current 11 texture files locally with stable filenames.
- Update `src/data/solarSystemData.ts` so every texture reference points to a local texture path derived from `import.meta.env.BASE_URL`.
- Add a contract test that enforces local texture URLs and verifies the expected files exist.

**Architecture**

The app already uses Vite and `THREE.TextureLoader` with URL strings. The lowest-risk change is to keep the current loading path unchanged and replace only the source URLs. Because this repo builds under a non-root Vite `base`, the local asset paths must be derived from `import.meta.env.BASE_URL` so the textures resolve correctly in both development and deployed builds.

**Files**

- Create `public/textures/`
- Modify `src/data/solarSystemData.ts`
- Create or update a contract test in `tests/`

**Success Criteria**

- No texture URL in `solarSystemData` points to `http://` or `https://`.
- Every configured texture path is local, avoids `http(s)`, and is derived from `import.meta.env.BASE_URL`.
- Each configured local texture file exists on disk under `public/textures/`.
- The app still builds successfully.

**Tradeoffs**

Using `public/` keeps the code change small and avoids refactoring the texture loading path. The tradeoff is that these files are served as static assets rather than imported modules, so they do not get hashed filenames from the bundler. That is acceptable for this task because the requirement is local URL loading with minimal change, and `import.meta.env.BASE_URL` handles the deployed path prefix.
