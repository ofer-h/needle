# @needle/config

Shared build/config base for the monorepo.

## Contents

- `tsconfig.base.json` — the common TypeScript compiler options (strict, bundler
  resolution, ES2022). Other packages extend it via a relative path:

  ```jsonc
  // packages/<name>/tsconfig.json
  { "extends": "../config/tsconfig.base.json", "include": ["src/**/*"] }
  ```

No build step; this package only ships config files.
