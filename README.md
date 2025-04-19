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
- Integrated caching system with unstorage

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
import { createArchive } from 'omnichron'
import createWayback from 'omnichron/providers/wayback'
import createArchiveToday from 'omnichron/providers/archive-today'

// Create an archive client for Wayback Machine
const waybackArchive = createArchive(createWayback())

// Get archived snapshots for a domain (with optional limit)
const response = await waybackArchive.getSnapshots('example.com', { limit: 100 })

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


// Using Archive.today
const archiveTodayArchive = createArchive(createArchiveToday())
const archiveTodayResponse = await archiveTodayArchive.getSnapshots('example.com')
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

### Using the Cache

omnichron provides an integrated caching system that helps reduce API calls and improve performance:

```ts
import { createArchive, configureCache } from 'omnichron'
import fsDriver from 'unstorage/drivers/fs'

// Configure the cache with custom settings
configureCache({
  // Use filesystem driver for persistent cache
  driver: fsDriver({ base: './cache' }),
  // Set cache TTL (time-to-live) in milliseconds (default: 7 days)
  ttl: 24 * 60 * 60 * 1000, // 1 day
  // Enable/disable cache globally (default: true)
  cache: true,
  // Set a custom cache key prefix (default: 'omnichron')
  prefix: 'my-app-cache'
})

import createWayback from 'omnichron/providers/wayback'
const archive = createArchive(createWayback())

// Use cache (default behavior)
const response1 = await archive.getSnapshots('example.com')
// First call hits API, subsequent calls use cache
const response2 = await archive.getSnapshots('example.com')
console.log('From cache:', response2.fromCache) // true

// Bypass cache for specific requests
const freshResponse = await archive.getSnapshots('example.com', { cache: false })
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
  fromCache?: boolean;  // Indicates if response came from cache
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

### Performance Optimizations

omnichron includes several performance optimizations for handling large volumes of requests:

```ts
import { createArchive } from 'omnichron'
import createWayback from 'omnichron/providers/wayback'

// Create archive with performance options
const archive = createArchive(createWayback(), {
  // Control parallel requests (default: 5)
  concurrency: 10,
  // Control batch processing size (default: 50)
  batchSize: 100,
  // Set request timeout in milliseconds (default: 30000)
  timeout: 60000,
  // Configure retry attempts for failed requests (default: 2)
  retries: 3
})

// These options can also be set per request
const response = await archive.getSnapshots('example.com', {
  concurrency: 5,
  timeout: 45000
})
```

Key performance features:

- **Concurrency control**: Limits the number of simultaneous requests to prevent overwhelming the remote server
- **Batch processing**: Processes large datasets in manageable chunks to optimize memory usage
- **Configurable timeouts**: Allows setting custom timeouts for all or specific requests
- **Automatic retries**: Includes intelligent retry strategy with configurable delay and status codes
- **Error handling**: Provides detailed error information with context for easier debugging

### Multiple Providers

You can now use multiple archive providers simultaneously:

```ts
import { createArchive } from 'omnichron'
import createWayback from 'omnichron/providers/wayback'
import createArchiveToday from 'omnichron/providers/archive-today'
import createPermacc from 'omnichron/providers/permacc'

// Create archive with multiple providers
const multiArchive = createArchive([
  createWayback(),
  createArchiveToday(),
  createPermacc({ apiKey: 'YOUR_API_KEY' })
])

// This will query all providers in parallel and combine results
const response = await multiArchive.getSnapshots('example.com', { 
  limit: 100,
  concurrency: 3  // Maximum number of providers to query simultaneously
})

// Results are automatically merged and sorted by date (newest first)
console.log(response.pages)
// Response includes metadata about the multi-provider query
console.log(response._meta.providerCount) // 3
```

### createArchive(providers, options?)

Creates an archive client for one or multiple providers.

- `providers`: A single archive provider instance or an array of providers
- `options`: Global options for all requests (optional)

Returns an object with:
- `getSnapshots(domain, options?)`: Function to get archived snapshots for a domain, returning a full response object
- `getPages(domain, options?)`: Function to get archived snapshots for a domain, returning only the pages array or throwing on error

### Providers

The individual provider factory functions can be imported directly:
- `import createWayback from 'omnichron/providers/wayback'` — Wayback Machine (web.archive.org)
- `import createArchiveToday from 'omnichron/providers/archive-today'` — Archive.today (archive.ph)
- `import createPermacc from 'omnichron/providers/permacc'` — Perma.cc (perma.cc)
- `import createCommonCrawl from 'omnichron/providers/commoncrawl'` — Common Crawl (commoncrawl.org)
- `import createUkWebArchive from 'omnichron/providers/uk-web-archive'` — UK Web Archive (webarchive.org.uk)

### getSnapshots(domain, options?)

Gets archived snapshots for a domain from the archive provider.

- `domain`: The domain to get archived snapshots for
- `options`: Request-specific options (optional)
  - `limit`: Maximum number of results to return
  - `cache`: Enable/disable caching for this request
  - `ttl`: Cache TTL in milliseconds for this request
  - `concurrency`: Maximum number of concurrent requests
  - `batchSize`: Number of items to process in a single batch
  - `timeout`: Request timeout in milliseconds
  - `retries`: Number of retry attempts for failed requests

### getPages(domain, options?)

Fetches archived snapshots for a domain, returning only the pages array or throwing an error if the request fails.

- `domain`: The domain to get archived snapshots for
- `options`: Request-specific options (optional)
  - `limit`: Maximum number of results to return
  - `cache`: Enable/disable caching for this request
  - `ttl`: Cache TTL in milliseconds for this request
  - `concurrency`: Maximum number of concurrent requests
  - `batchSize`: Number of items to process in a single batch
  - `timeout`: Request timeout in milliseconds
  - `retries`: Number of retry attempts for failed requests

### configureCache(options?)

Configures the caching system.

- `options`: Configuration options (optional)
  - `driver`: Custom storage driver from unstorage
  - `ttl`: Default TTL in milliseconds
  - `cache`: Enable/disable cache globally

### clearCache()

Clears all cached responses.

### clearProviderCache(provider)

Clears cached responses for a specific provider.

- `provider`: The provider object or slug name to clear cache for

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
- ✅ Local and persistent caching layer using unstorage
- ✅ Performance optimizations for high-volume requests
  - Parallel processing with concurrency control
  - Batch processing for large datasets
  - Configurable timeouts and retries

## License

MIT