# Changelog


## v0.2.2

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.1...v0.2.2)

### 🚀 Enhancements

- Enhance performance and caching across multiple providers ([bf9257f](https://github.com/oritwoen/omnichron/commit/bf9257f))
- Add structured logging with consola for improved error handling ([ecc3989](https://github.com/oritwoen/omnichron/commit/ecc3989))

### 💅 Refactors

- **tests:** Update provider handling and skip error tests for various archives ([69203fe](https://github.com/oritwoen/omnichron/commit/69203fe))
- **docs:** Simplify usage examples and update provider imports in README ([07b871e](https://github.com/oritwoen/omnichron/commit/07b871e))
- Integrate normalizeDomain and mapCdxRows utility functions across providers ([aa07d53](https://github.com/oritwoen/omnichron/commit/aa07d53))
- Simplify mapCdxRows by destructuring parameters for clarity ([1145833](https://github.com/oritwoen/omnichron/commit/1145833))
- Streamline playground scripts by removing unused files and optimizing imports ([de35328](https://github.com/oritwoen/omnichron/commit/de35328))
- Enhance archive functions by adding getPages and improving documentation ([62f12c6](https://github.com/oritwoen/omnichron/commit/62f12c6))
- **docs:** Enhance provider documentation with detailed descriptions and method signatures ([21f9698](https://github.com/oritwoen/omnichron/commit/21f9698))
- Replace logical OR with nullish coalescing operator for improved clarity ([1f8c2e8](https://github.com/oritwoen/omnichron/commit/1f8c2e8))
- Enhance type safety by adding specific metadata interfaces for archive providers ([3a38187](https://github.com/oritwoen/omnichron/commit/3a38187))
- Remove unused metadata types and enhance ArchivedPage typing for better clarity ([dbe77cd](https://github.com/oritwoen/omnichron/commit/dbe77cd))
- Add provider metadata to mapCdxRows and enhance metadata interfaces for better clarity ([8838c9c](https://github.com/oritwoen/omnichron/commit/8838c9c))
- Replace clearCache with storage.clear for improved cache management ([5526f65](https://github.com/oritwoen/omnichron/commit/5526f65))
- Replace forEach with for...of loops for improved performance and clarity ([f7465ab](https://github.com/oritwoen/omnichron/commit/f7465ab))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.1

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.0...v0.2.1)

### 🚀 Enhancements

- Add cache layer ([af5ba10](https://github.com/oritwoen/omnichron/commit/af5ba10))

### 🩹 Fixes

- Update import path for utility functions in wayback provider ([19a15a6](https://github.com/oritwoen/omnichron/commit/19a15a6))

### 💅 Refactors

- Update provider name handling ([9ddcbea](https://github.com/oritwoen/omnichron/commit/9ddcbea))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.0

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.1.2...v0.2.0)

### 💅 Refactors

- ⚠️  Rename platform to provider ([48d8cd3](https://github.com/oritwoen/omnichron/commit/48d8cd3))
- Update terminology from platforms to providers in README ([e8f5a5b](https://github.com/oritwoen/omnichron/commit/e8f5a5b))
- Streamline response handling and utility functions across providers ([161b2d9](https://github.com/oritwoen/omnichron/commit/161b2d9))
- Update terminology from platforms to providers and restructure provider exports ([3c99380](https://github.com/oritwoen/omnichron/commit/3c99380))

#### ⚠️ Breaking Changes

- ⚠️  Rename platform to provider ([48d8cd3](https://github.com/oritwoen/omnichron/commit/48d8cd3))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.1.2

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.1.1...v0.1.2)

### 🚀 Enhancements

- Add UK Web Archive platform support with snapshot fetching and tests ([4e6aed0](https://github.com/oritwoen/omnichron/commit/4e6aed0))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.1.1


### 💅 Refactors

- Replace listPages with getSnapshots in test files ([e6e19d3](https://github.com/oritwoen/omnichron/commit/e6e19d3))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

