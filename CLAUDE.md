# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

omnichron — unified TypeScript interface for querying web archive providers (Wayback Machine, Archive.today, Common Crawl, Perma.cc, WebCite). Built on unjs ecosystem (ofetch, unstorage, c12, consola, ufo, obuild).

## Commands

```bash
pnpm install              # install deps (pnpm 10.8.1 enforced via packageManager)
pnpm dev                  # vitest watch mode
pnpm test                 # full: lint + type-check + vitest with coverage
pnpm test:types           # tsc --noEmit --skipLibCheck
pnpm lint                 # oxlint + eslint
pnpm lint:fix             # oxlint --fix + eslint --fix
pnpm fmt                  # oxlint --fix + oxfmt
pnpm build                # obuild src/index.ts → dist/
npx vitest run test/wayback.test.ts   # run a single test file
bash test.sh              # integration: build lib + build playground
```

## Architecture

**Entry point**: `src/index.ts` — barrel that re-exports the public API surface. Types via `export type *`.

**Core flow**: `createArchive(providers, options?)` in `src/archive.ts` accepts provider(s), returns `ArchiveInterface` with `snapshots()`, `getPages()`, `use()`, `useAll()`. Providers are lazy-loaded via dynamic imports in `src/providers/index.ts` for tree-shaking.

**Provider pattern**: Each provider (`src/providers/*.ts`) is a default-export factory function returning `ArchiveProvider { name, slug, snapshots() }`. All providers normalize responses through `createSuccessResponse`/`createErrorResponse` helpers in `src/utils/_utils.ts`. Wayback and Common Crawl share CDX format via `mapCdxRows`.

**Option merging**: Three-level cascade — config defaults (c12) → init options → request options — via `mergeOptions()`. Config is always async (c12 propagates).

**Caching**: `src/storage.ts` uses unstorage with memory driver by default. Key format: `{prefix}:{providerSlug}:{domain}[:{limit}]`.

**Config loading**: `src/config.ts` uses c12 to load from `omnichron.config.ts`, `.omnichron`, or `package.json`. Supports env-specific overrides (`$development`, `$production`, `$test`).

**Types**: All interfaces in `src/types.ts`. Provider-specific option types in `src/_providers.ts` (not alongside provider implementations).

## Conventions

- Underscore-prefixed files (`_utils.ts`, `_providers.ts`) are internal — not for consumer import.
- Zero type suppression: no `as any`, `@ts-ignore`, `@ts-expect-error` anywhere.
- ESLint uses `eslint-config-unjs` preset. Only override: `unicorn/numeric-separators-style: off`.
- Providers convert native timestamps to ISO 8601; raw format preserved in `_meta`.
- `providers.all()` intentionally excludes Perma.cc (requires API key).
- `configureStorage()` is `@deprecated` — use config files or `createArchive` options instead.
- WebCite is read-only (no longer accepts new archives).

## Testing

Tests in `test/` mirror `src/` structure. Uses vitest with `vi.mock()` and `vi.fn()` for mocking external deps. Coverage configured for `src/` directory with text, json, html reporters.

## Playground

`playground/` is a Nuxt 3 app targeting Cloudflare Workers (`nitro.preset = 'cloudflare_module'`) with one API endpoint per provider for manual testing.
