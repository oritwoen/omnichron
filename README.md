# omnichron

[![npm version](https://img.shields.io/npm/v/omnichron.svg?color=black)](https://www.npmjs.com/package/omnichron)
[![License: MIT](https://img.shields.io/badge/License-MIT-black)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/oritwoen/omnichron/ci.yml?branch=main&color=black)](https://github.com/oritwoen/omnichron/actions)
[![Test Coverage](https://img.shields.io/codecov/c/github/oritwoen/omnichron?color=black)](https://codecov.io/gh/oritwoen/omnichron)
[![npm downloads](https://img.shields.io/npm/dm/omnichron.svg?color=black)](https://www.npmjs.com/package/omnichron)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/omnichron?color=black)](https://bundlephobia.com/package/omnichron)

> [!WARNING]
> **Early Development Stage**: This project is under active development and may undergo significant API changes between versions.

> Unified interface for web archive providers

## Features

- Simple API for listing archived URLs for a domain
- Support for multiple archive providers:
  - Internet Archive's Wayback Machine (web.archive.org)
  - Archive.today (archive.ph)
  - Perma.cc (perma.cc)
  - Common Crawl (commoncrawl.org)
  - UK Web Archive (webarchive.org.uk)
- Consistent, standardized response format with platform-specific metadata
- Tree-shakable design: import only the providers you need
- Configurable request options
- TypeScript support

## Install

```bash
# npm
npm install omnichron

# yarn
yarn add omnichron

# pnpm
pnpm add omnichron
```

## Usage

```ts
import { createArchive, providers } from 'omnichron'

// Create an archive client for Wayback Machine
const waybackArchive = createArchive(providers.wayback)

// Or with custom URLs
const customWayback = createArchive(createWayback({
  baseUrl: 'https://web.archive.org',       // API base URL
  snapshotUrl: 'https://web.archive.org/web' // URL for snapshot links
}))

// Get archived snapshots for a domain
const response = await waybackArchive.getSnapshots('example.com')

if (response.success) {
  console.log('Archived snapshots:', response.pages)
  // [
  //   { 
  //     url: 'https://example.com', 
  //     timestamp: '2022-01-01T00:00:00Z',
  //     snapshot: 'https://web.archive.org/web/20220101000000/https://example.com',
  //     _meta: { 
  //       timestamp: '20220101000000', 
  //       status: 200 
  //     }
  //   },
  //   ...
  // ]
} else {
  console.error('Error:', response.error)
}

// With limit option
const response = await waybackArchive.getSnapshots('example.com', {
  // Pagination option
  limit: 100
})

// Using archive.today
const archiveTodayArchive = createArchive(providers.archive)
const response = await archiveTodayArchive.getSnapshots('example.com')
```

### Tree-shaking support

For better performance and smaller bundle size, you can import only the providers you need:

```ts
// Only import Wayback Machine
import { createArchive } from 'omnichron'
import createWayback from 'omnichron/providers/wayback'

const waybackProvider = createWayback()
const archive = createArchive(waybackProvider)
```

### TypeScript support

The library uses TypeScript for type safety, including type assertions for API responses:

```ts
// Example of typed response handling
interface PermaccResponse {
  objects: Array<{
    guid: string
    url: string
    creation_timestamp: string
  }>
  meta: {
    total_count: number
  }
}

// Using type assertion for proper typing
const response = await ofetch('/api/endpoint', options) as PermaccResponse

// Now you have full autocompletion and type safety
console.log(response.objects[0].guid)
console.log(response.meta.total_count)
```

### Using Perma.cc

Perma.cc requires an API key for authentication:

```ts
import { createArchive } from 'omnichron'
import createPermacc from 'omnichron/providers/permacc'

// Create with required API key
const permaccProvider = createPermacc({
  apiKey: 'YOUR_API_KEY'
})

const archive = createArchive(permaccProvider)
const response = await archive.getSnapshots('example.com')
```

### Using Common Crawl

CommonCrawl provides access to massive web archives through different crawl collections:

```ts
import { createArchive } from 'omnichron'
import createCommonCrawl from 'omnichron/providers/commoncrawl'

// Create with a specific collection or use latest (default)
const commonCrawlProvider = createCommonCrawl({
  collection: 'CC-MAIN-2023-50',
  limit: 50  // Maximum number of results
})

const archive = createArchive(commonCrawlProvider)
const response = await archive.getSnapshots('example.com')
```

## Response format

All providers return data in a consistent format with standardized fields plus provider-specific metadata:

```typescript
interface ArchiveResponse {
  success: boolean;  // Boolean indicating success/failure
  pages: ArchivedPage[];  // Array of archived pages
  error?: string;  // Error message if success is false
  _meta?: Record<string, any>;  // Response-level provider-specific metadata
}

interface ArchivedPage {
  url: string;  // The original URL (consistent across all providers)
  timestamp: string;  // ISO 8601 date format (consistent across all providers)
  snapshot: string;  // Direct URL to the archived version of the page
  _meta: {  // Provider-specific metadata
    // For Wayback Machine:
    timestamp?: string;  // Original timestamp format
    status?: number;  // HTTP status code
    
    // For Archive.today:
    hash?: string;  // Hash from the archive URL
    raw_date?: string;  // Original date string from archive.today
    
    // For Perma.cc:
    guid?: string;  // Perma.cc's unique identifier
    title?: string;  // Title of the archived page
    status?: string;  // Status of the archived page
    created_by?: string;  // ID of the user who created the archive
    
    // For Common Crawl:
    digest?: string;  // Content digest (hash)
    mime?: string;  // MIME type of the content
    length?: string;  // Content length
    collection?: string;  // Common Crawl collection identifier
    
    // For UK Web Archive:
    timestamp?: string;  // Original timestamp format
    status?: number;  // HTTP status code
  };
}
```

## API

### createArchive(provider, options?)

Creates an archive client for the specified provider.

- `provider`: An archive provider instance
- `options`: Global options for all requests (optional)

Returns an object with:
- `getSnapshots(domain, options?)`: Function to get archived snapshots for a domain

### providers

Object containing provider mappings for dynamic imports:
- `providers['wayback']`: Wayback Machine (web.archive.org)
- `providers['archive-today']`: Archive.today (archive.ph)
- `providers['permacc']`: Perma.cc (perma.cc)
- `providers['commoncrawl']`: Common Crawl (commoncrawl.org)
- `providers['uk-web-archive']`: UK Web Archive (webarchive.org.uk)

### getSnapshots(domain, options?)

Gets archived snapshots for a domain from the archive provider.

- `domain`: The domain to get archived snapshots for
- `options`: Request-specific options (optional)
  - `limit`: Maximum number of results to return

## Roadmap

### Future Providers
- ✅ Internet Archive's Wayback Machine
- ✅ Archive.today
- ✅ Perma.cc
- ✅ Common Crawl
- ✅ UK Web Archive
- 🔜 Archive-It
- 🔜 Memento Time Travel
- 🔜 WebCite
- 🔜 Conifer (formerly Webrecorder)

### Future Features
- 🔜 Page Archiving API - create archives in addition to retrieving them
- 🔜 Local and persistent caching layer using unstorage
- 🔜 Performance optimizations for high-volume requests

## License

MIT
