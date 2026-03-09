# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-09
**Commit:** 6e40870
**Branch:** main

## OVERVIEW

Unified TypeScript interface for querying web archive providers (Wayback Machine, Archive.today, Common Crawl, Perma.cc, WebCite). Built on the unjs ecosystem: ofetch, unstorage, c12, consola, ufo, obuild, changelogen.

## STRUCTURE

```
omnichron/
├── src/
│   ├── index.ts          # barrel - public API surface
│   ├── archive.ts        # createArchive factory (core logic)
│   ├── types.ts          # all interfaces/types (150 lines, 30+ symbols)
│   ├── _providers.ts     # provider-specific option types (internal)
│   ├── config.ts         # c12-based config loading with caching
│   ├── storage.ts        # unstorage caching layer
│   ├── providers/        # one file per archive source + barrel
│   └── utils/            # parallel processing, response helpers, domain normalization
├── test/                 # mirrors src/ structure, one .test.ts per module
├── playground/           # Nuxt app (Cloudflare preset) for manual provider testing
└── .github/workflows/    # ci.yml + autofix.yml
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add a provider | `src/providers/` + register in `src/providers/index.ts` | Copy wayback.ts as template. Default export factory fn returning `ArchiveProvider` |
| Provider-specific options | `src/_providers.ts` | Extend `ArchiveOptions`, add to `ProviderOptions` map |
| Change public API | `src/index.ts` | Barrel re-exports only. Types via `export type *` |
| Modify caching | `src/storage.ts` | Key format: `{prefix}:{providerSlug}:{domain}:{limit?}` |
| Config defaults | `src/config.ts` → `getDefaultConfig()` | c12 loads from `.omnichron`, `omnichron.config.ts`, `package.json` |
| Response helpers | `src/utils/_utils.ts` | `createSuccessResponse`, `createErrorResponse`, `mergeOptions` |
| Parallel processing | `src/utils/_utils.ts` → `processInParallel` | Concurrency + batch control |
| CDX row mapping | `src/utils/_utils.ts` → `mapCdxRows` | Wayback/CommonCrawl share CDX format |
| Test a provider | `test/{provider}.test.ts` | Uses vitest, mocks with `vi.fn()` |
| Manual testing | `playground/server/api/snapshots/` | One Nuxt endpoint per provider |
| Integration test | `test.sh` | Builds lib, then builds playground against it |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `createArchive` | function | archive.ts:34 | Core factory. Accepts provider(s) + options, returns `ArchiveInterface` |
| `providers` | object | providers/index.ts:14 | Lazy-loading factory. Each method returns `Promise<ArchiveProvider>` |
| `ArchiveInterface` | interface | types.ts:135 | Public API: `snapshots()`, `getPages()`, `use()`, `useAll()` |
| `ArchiveProvider` | interface | types.ts:121 | Provider contract: `name`, `slug?`, `snapshots()` |
| `ArchiveResponse` | interface | types.ts:104 | `{ success, pages, error?, _meta?, fromCache? }` |
| `ArchivedPage` | interface | types.ts:73 | `{ url, timestamp, snapshot, _meta }` |
| `OmnichronConfig` | interface | config.ts:8 | Config shape: `storage` + `performance` + env overrides |
| `processInParallel` | function | utils/_utils.ts:8 | Generic parallel executor with concurrency + batching |
| `configureStorage` | function | storage.ts:165 | **@deprecated** - use config files or createArchive options |

## CONVENTIONS

- **Underscore prefix** = internal module (`_utils.ts`, `_providers.ts`). Not for direct import by consumers.
- **Provider pattern**: default export factory fn → returns `{ name, slug, snapshots() }`. Always async via `Promise<ArchiveProvider>`.
- **Lazy loading**: providers loaded via `await import('./provider')` in `providers/index.ts`. Enables tree-shaking.
- **Response normalization**: all providers must return `ArchiveResponse` via `createSuccessResponse`/`createErrorResponse` helpers.
- **Timestamp format**: providers convert native timestamps to ISO 8601. Raw format preserved in `_meta`.
- **Option merging**: three-level cascade: config defaults → init options → request options. Via `mergeOptions()`.
- **ESLint**: `eslint-config-unjs` preset. Only override: `unicorn/numeric-separators-style: off`.
- **Build**: `obuild src/index.ts` → `dist/`. Single entry point.
- **Release**: `pnpm test && changelogen --release --push && pnpm publish`.

## ANTI-PATTERNS (THIS PROJECT)

- **Do not suppress types**: no `as any`, `@ts-ignore`. The codebase has zero instances.
- **Do not call `configureStorage` in new code**: it's `@deprecated`. Use config files or pass options to `createArchive`.
- **Do not pass `Promise[]` to `createArchive`**: `createArchive([providers.wayback(), ...])` is a type error. Use `Promise.all()` wrapper or `providers.all()`.
- **Do not add Perma.cc to `providers.all()`**: requires API key. Excluded intentionally.
- **Do not put provider types in `providers/`**: provider-specific option types live in `src/_providers.ts`, not alongside implementations.

## COMMANDS

```bash
pnpm install          # install deps
pnpm dev              # vitest watch mode
pnpm test             # lint + type-check + vitest with coverage
pnpm test:types       # tsc --noEmit --skipLibCheck
pnpm lint             # eslint
pnpm lint:fix         # eslint --fix
pnpm build            # obuild src/index.ts → dist/
pnpm release          # test + changelogen + publish
bash test.sh          # build lib + build playground (integration)
```

## NOTES

- **Config is async**: `getConfig()`, `resolveConfig()`, `mergeOptions()`, `createFetchOptions()` are all async because c12 config loading is async. This propagates throughout.
- **Defaults**: concurrency=3, batchSize=20, timeout=10000ms, retries=1, cache TTL=7 days. README and code must match.
- **WebCite is read-only**: no longer accepts new archives. Provider returns placeholder timestamps.
- **Archive.today uses Memento API**: parses timemap link headers with regex. Fragile if format changes.
- **Playground targets Cloudflare**: `nitro.preset = 'cloudflare_module'` with `nodeCompat: true`.
- **CI runs coverage separately**: `pnpm vitest --coverage` as its own step, not via `pnpm test`.
- **Autofix CI**: PRs get auto-committed lint fixes via `autofix-ci/action`.
- **Renovate**: extends `github>unjs/renovate-config` for dependency updates.
- **coverage/ is committed**: HTML coverage reports are in git (not in .gitignore despite `dist` being ignored).
