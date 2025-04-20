# Changelog


## v0.3.0

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.10...v0.3.0)

### 🚀 Enhancements

- ⚠️  Implement lazy-loading ([961643e](https://github.com/oritwoen/omnichron/commit/961643e))

### 💅 Refactors

- Streamline provider imports and usage in archive creation ([bfb7154](https://github.com/oritwoen/omnichron/commit/bfb7154))
- Remove unused ArchiveInterface import from archive.ts ([30bd845](https://github.com/oritwoen/omnichron/commit/30bd845))
- Update usage examples to utilize lazy-loading for archive providers ([13bef50](https://github.com/oritwoen/omnichron/commit/13bef50))

### 🏡 Chore

- Remove old playgrounds ([50de406](https://github.com/oritwoen/omnichron/commit/50de406))

#### ⚠️ Breaking Changes

- ⚠️  Implement lazy-loading ([961643e](https://github.com/oritwoen/omnichron/commit/961643e))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.10

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.9...v0.2.10)

### 💅 Refactors

- Replace ofetch with $fetch in archive providers ([47075a0](https://github.com/oritwoen/omnichron/commit/47075a0))
- Improve test suite ([af7c9db](https://github.com/oritwoen/omnichron/commit/af7c9db))

### 🏡 Chore

- Update packageManager to pnpm@10.8.1 ([1643f47](https://github.com/oritwoen/omnichron/commit/1643f47))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.9

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.8...v0.2.9)

### 🚀 Enhancements

- Add webcite provider ([1ee9024](https://github.com/oritwoen/omnichron/commit/1ee9024))

### 💅 Refactors

- Remove unused permacc.mjs file and update permacc provider to require apiKey ([7c48b48](https://github.com/oritwoen/omnichron/commit/7c48b48))
- Remove UK Web Archive provider and related tests ([19279bd](https://github.com/oritwoen/omnichron/commit/19279bd))
- Remove Memento Time Travel provider and related tests ([11c6c0f](https://github.com/oritwoen/omnichron/commit/11c6c0f))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.8

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.7...v0.2.8)

### 🩹 Fixes

- Enhance Common Crawl provider to handle collection fetching ([2ebe1ef](https://github.com/oritwoen/omnichron/commit/2ebe1ef))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.7

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.6...v0.2.7)

### 🩹 Fixes

- Update archive.today provider to use Memento API ([0960ea4](https://github.com/oritwoen/omnichron/commit/0960ea4))
- Update snapshot URL handling and improve test cases for archive.today provider ([e290273](https://github.com/oritwoen/omnichron/commit/e290273))

### 💅 Refactors

- Rename variables for clarity in archive provider and debug script ([ecf191b](https://github.com/oritwoen/omnichron/commit/ecf191b))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.6

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.5...v0.2.6)

### 🩹 Fixes

- Update package paths and import statements for better module resolution ([dfc4120](https://github.com/oritwoen/omnichron/commit/dfc4120))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.5

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.4...v0.2.5)

### 🏡 Chore

- Update build process ([7bc36e5](https://github.com/oritwoen/omnichron/commit/7bc36e5))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.4

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.3...v0.2.4)

### 🚀 Enhancements

- Add configuration management ([0a3e802](https://github.com/oritwoen/omnichron/commit/0a3e802))
- Add Memento Time Travel provider ([0bebe08](https://github.com/oritwoen/omnichron/commit/0bebe08))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

## v0.2.3

[compare changes](https://github.com/oritwoen/omnichron/compare/v0.2.2...v0.2.3)

### 🩹 Fixes

- Update package versions to remove caret and link specifications for consistency ([bedb94c](https://github.com/oritwoen/omnichron/commit/bedb94c))

### 🏡 Chore

- Rename `cache` to `storage` ([1f1e860](https://github.com/oritwoen/omnichron/commit/1f1e860))

### ❤️ Contributors

- Dominik Opyd <dominik.opyd@gmail.com>

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

