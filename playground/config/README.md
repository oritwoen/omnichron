# Omnichron Configuration Guide

This directory contains examples of how to configure Omnichron using various methods and storage drivers.

## Configuration Files

- `omnichron.config.ts` - TypeScript configuration file example
- You can also use `.js`, `.mjs`, `.cjs`, `.json`, `.yaml`, `.toml` formats
- `.omnichron` files in RC format are also supported

## Usage

To use these configuration examples:

1. Copy the desired configuration file to your project root
2. Customize the settings according to your needs
3. Omnichron will automatically detect and use your configuration

## Configuration Options

### Storage Options

- `driver` - Storage driver to use (default: memory)
- `cache` - Enable/disable caching (default: true)
- `ttl` - Cache TTL in milliseconds (default: 7 days)
- `prefix` - Prefix for storage keys (default: "omnichron")

### Available Storage Drivers

Omnichron uses [unstorage](https://github.com/unjs/unstorage) under the hood, which provides many storage drivers. First install the desired driver:

```bash
# Install the driver(s) you need
npm install unstorage
# For specific drivers (optional)
npm install redis mongodb cloudflare
```

#### Memory Driver (Default)

In-memory storage with no persistence - data is lost when the process restarts.

```js
import { configureStorage } from 'omnichron'
import memoryDriver from 'unstorage/drivers/memory'

await configureStorage({
  driver: memoryDriver({
    size: 1000 // Optional: limit maximum items (uses LRU internally)
  })
})
```

#### File System Driver

Stores data as files on disk - persists between restarts.

```js
import { configureStorage } from 'omnichron'
import fsDriver from 'unstorage/drivers/fs'

await configureStorage({
  driver: fsDriver({
    base: './.cache', // Path to store cache files
    ignore: ['.*'],   // Optional: ignore patterns
    readOnly: false,  // Optional: set to true for read-only access
    ttl: 3600,        // Optional: default TTL in seconds
    invalidation: {   // Optional: stale-while-revalidate settings
      revalidate: true
    }
  })
})
```

#### Redis Driver

High-performance networked cache storage that persists between restarts.

```js
import { configureStorage } from 'omnichron'
import redisDriver from 'unstorage/drivers/redis'

await configureStorage({
  driver: redisDriver({
    url: 'redis://localhost:6379',    // Redis connection URL
    ttl: 60 * 60,                     // Default TTL in seconds (1 hour)
    base: 'omnichron:',               // Optional key prefix
    tls: {},                          // Optional TLS options
    cluster: false,                   // Optional Redis cluster mode
    // Optional: Redis password if not included in URL
    password: process.env.REDIS_PASSWORD 
  })
})
```

#### Cloudflare KV Driver

Use Cloudflare's global KV storage (requires Cloudflare Workers).

```js
import { configureStorage } from 'omnichron'
import cloudflareKVDriver from 'unstorage/drivers/cloudflare-kv'

await configureStorage({
  driver: cloudflareKVDriver({
    binding: YOUR_KV_NAMESPACE, // KV namespace binding from your worker
    ttl: 60 * 60 * 24,         // Default TTL in seconds (1 day)
    base: 'omnichron:'         // Optional key prefix
  })
})
```

#### MongoDB Driver

Store data in MongoDB documents - scales well for large datasets.

```js
import { configureStorage } from 'omnichron'
import mongodbDriver from 'unstorage/drivers/mongodb'

await configureStorage({
  driver: mongodbDriver({
    connectionString: 'mongodb://localhost:27017/mydb',
    collection: 'omnichron_cache',
    ttl: 60 * 60 * 24 // 1 day in seconds
  })
})
```

#### LRU Cache Driver

Memory cache with a maximum item limit.

```js
import { configureStorage } from 'omnichron'
import lruCacheDriver from 'unstorage/drivers/lru-cache'

await configureStorage({
  driver: lruCacheDriver({
    max: 1000,        // Maximum number of items to store
    ttl: 60 * 60      // TTL in seconds (1 hour)
  })
})
```

#### Other Available Drivers

- `azureStorageBlob` - Azure Storage Blob
- `azureCosmosDb` - Azure Cosmos DB
- `github` - GitHub repository
- `http` - HTTP-based storage with REST API
- `indexedDb` - Browser's IndexedDB
- `localStorage` - Browser's localStorage 
- `sessionStorage` - Browser's sessionStorage
- `overlayfs` - Mount multiple storage drivers in layers
- `vercelKV` - Vercel KV storage

Full list at [unstorage.unjs.io/drivers](https://unstorage.unjs.io/drivers/)

### Performance Options

- `concurrency` - Maximum concurrent requests (default: 3)
- `batchSize` - Items to process in one batch (default: 20)
- `timeout` - Request timeout in milliseconds (default: 10000)
- `retries` - Number of retry attempts (default: 1)

### Environment-Specific Configuration

You can define different configurations for development, production, and test environments:

```typescript
export default {
  // Default settings
  storage: { 
    ttl: 3600000 // 1 hour
  },
  
  // Development environment
  $development: {
    storage: {
      ttl: 60000, // 1 minute in development
      driver: memoryDriver() // Use memory in development
    }
  },
  
  // Production environment
  $production: {
    storage: {
      ttl: 86400000, // 1 day in production
      driver: redisDriver({
        url: process.env.REDIS_URL
      })
    }
  },
  
  // Test environment
  $test: {
    storage: {
      cache: false // Disable caching in tests
    }
  }
}
```

## Advanced Usage

### Mounting Multiple Drivers

You can combine multiple storage drivers with mountpoints:

```js
import { configureStorage, createStorage } from 'omnichron'
import memoryDriver from 'unstorage/drivers/memory'
import fsDriver from 'unstorage/drivers/fs'
import redisDriver from 'unstorage/drivers/redis'

const storage = createStorage()

// Mount different drivers to different paths
storage.mount('temp', memoryDriver())               // Short-lived data
storage.mount('disk', fsDriver({ base: './.cache' })) // Persistent local data
storage.mount('remote', redisDriver({ url: process.env.REDIS_URL })) // Shared data

await configureStorage({ driver: storage })
```

### Running the Examples

To run the examples with specific configuration:

```js
import { getConfig } from 'omnichron'

// The configuration will be automatically loaded from nearby files
const config = await getConfig({ 
  cwd: __dirname, // Specify the directory to look for config
  envName: 'development' // Specify environment (optional)
})

console.log(config)
```