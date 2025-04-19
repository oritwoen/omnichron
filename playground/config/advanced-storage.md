# Advanced Storage Configuration for Omnichron

This guide covers advanced storage configuration techniques for Omnichron using unstorage drivers.

## Multi-tier Storage with Mountpoints

One of the most powerful features of unstorage is the ability to mount multiple storage drivers at different paths, creating a hierarchical storage system.

```js
import { configureStorage, createStorage } from 'omnichron'
import memoryDriver from 'unstorage/drivers/memory'
import fsDriver from 'unstorage/drivers/fs'
import redisDriver from 'unstorage/drivers/redis'

// Create a storage instance
const storage = createStorage()

// Configure storage with different tiers
storage.mount('memory', memoryDriver())     // Fast, volatile memory cache
storage.mount('local', fsDriver({           // Persistent local storage
  base: './.cache'
}))
storage.mount('shared', redisDriver({       // Distributed shared cache
  url: process.env.REDIS_URL
}))

// Configure Omnichron to use this storage
await configureStorage({ driver: storage })
```

With this configuration, you can store different types of data in different storage tiers:

```js
// Store frequently accessed data in memory for speed
await storage.setItem('memory:frequently-accessed', data1)

// Store larger datasets on disk
await storage.setItem('local:large-dataset', data2)

// Store shared data that needs to be accessed by multiple instances
await storage.setItem('shared:global-config', data3)
```

## Layered Storage (Overlay)

The overlay driver allows you to create a layered storage system where data is read from multiple drivers in order, but written to a specific one.

```js
import { configureStorage } from 'omnichron'
import overlayDriver from 'unstorage/drivers/overlay'
import memoryDriver from 'unstorage/drivers/memory'
import fsDriver from 'unstorage/drivers/fs'

await configureStorage({
  driver: overlayDriver({
    // Layers are checked in order until item is found
    layers: [
      // Fast in-memory cache checked first
      memoryDriver({ 
        size: 1000 
      }),
      // Persistent storage checked second
      fsDriver({ 
        base: './.cache' 
      })
    ],
    // New items are written to this driver
    writeTo: 0 // Write to first layer (memory)
  })
})
```

This creates a read-through cache where:
1. Data is first checked in memory
2. If not found, checked on disk
3. All writes go to memory for fast access

## Caching Strategies

### TTL-Based Expiration

Control how long items remain in storage before expiring:

```js
import { configureStorage } from 'omnichron'
import memoryDriver from 'unstorage/drivers/memory'

await configureStorage({
  driver: memoryDriver(),
  ttl: 3600000 // Global default: 1 hour in milliseconds
})

// Per-item TTL
await storage.setItem('key', 'value', {
  ttl: 300000 // This item expires in 5 minutes
})
```

### Stale-While-Revalidate

Some drivers support stale-while-revalidate pattern for better performance:

```js
import { configureStorage } from 'omnichron'
import fsDriver from 'unstorage/drivers/fs'

await configureStorage({
  driver: fsDriver({
    base: './.cache',
    invalidation: {
      revalidate: true,   // Enable revalidation
      headOnly: true,     // Only check headers for changes
      retry: 3,           // Number of retries
      maxAge: 60          // Seconds before considered stale
    }
  })
})
```

With this configuration:
1. Expired items are still returned while being revalidated
2. The client gets an immediate response, even if stale
3. The storage is updated in the background

## Storage Events

You can listen to storage events to monitor and debug:

```js
import { storage } from 'omnichron'

// Listen for all events
storage.watch((event, path) => {
  console.log(`Storage event: ${event} at ${path}`)
})

// Watch specific key
storage.watch('user:preferences', (event) => {
  console.log(`User preferences ${event}`)
})
```

## Namespacing with Prefixes

Use prefixes to organize your data within a storage driver:

```js
import { configureStorage } from 'omnichron'
import fsDriver from 'unstorage/drivers/fs'

await configureStorage({
  driver: fsDriver({ base: './.cache' }),
  prefix: 'app:v1' // Global prefix for all keys
})

// Keys will be stored as "app:v1:provider:domain"
```

## Handling Large Datasets

For large datasets, consider using pagination or streaming:

```js
// List all keys with a certain prefix
const keys = await storage.getKeys('archive:wayback')

// Process in batches to avoid memory issues
const batchSize = 100
for (let i = 0; i < keys.length; i += batchSize) {
  const batch = keys.slice(i, i + batchSize)
  
  // Process batch of keys
  for (const key of batch) {
    const value = await storage.getItem(key)
    // Process value
  }
}
```

## Storage Migrations

When changing storage structure, you may need to migrate data:

```js
// Example migration from old to new structure
async function migrateStorage() {
  // Get all keys matching old pattern
  const oldKeys = await storage.getKeys('oldPrefix:')
  
  for (const oldKey of oldKeys) {
    // Get the value from the old key
    const value = await storage.getItem(oldKey)
    
    if (value) {
      // Create new key with new format
      const newKey = oldKey.replace('oldPrefix:', 'newPrefix:v2:')
      
      // Store at new location
      await storage.setItem(newKey, value)
      
      // Optionally remove old item
      await storage.removeItem(oldKey)
    }
  }
  
  console.log(`Migrated ${oldKeys.length} items`)
}
```

## Dynamically Switching Storage Drivers

You can switch storage drivers at runtime based on context:

```js
import { configureStorage } from 'omnichron'
import memoryDriver from 'unstorage/drivers/memory'
import fsDriver from 'unstorage/drivers/fs'

// Function to configure appropriate storage for environment
async function setupEnvironmentStorage() {
  if (process.env.NODE_ENV === 'test') {
    // Use memory driver for tests
    await configureStorage({
      driver: memoryDriver(),
      prefix: 'test'
    })
  } else if (process.env.NODE_ENV === 'development') {
    // Use file system driver for development
    await configureStorage({
      driver: fsDriver({ base: './.dev-cache' }),
      prefix: 'dev'
    })
  } else {
    // Use Redis driver for production
    await configureStorage({
      driver: redisDriver({ url: process.env.REDIS_URL }),
      prefix: 'prod'
    })
  }
}
```

## Storage Monitoring

For production systems, you may want to monitor storage metrics:

```js
// Simple storage monitoring wrapper
function monitorStorage(storage) {
  const originalSetItem = storage.setItem.bind(storage)
  const originalGetItem = storage.getItem.bind(storage)
  
  // Track metrics
  const metrics = {
    reads: 0,
    writes: 0,
    hits: 0,
    misses: 0,
    errors: 0
  }
  
  // Wrap methods with monitoring
  storage.setItem = async (key, value, options) => {
    try {
      const start = Date.now()
      await originalSetItem(key, value, options)
      const duration = Date.now() - start
      
      metrics.writes++
      console.log(`WRITE ${key} (${duration}ms)`)
    } catch (error) {
      metrics.errors++
      console.error(`WRITE ERROR ${key}`, error)
      throw error
    }
  }
  
  storage.getItem = async (key) => {
    try {
      const start = Date.now()
      const value = await originalGetItem(key)
      const duration = Date.now() - start
      
      metrics.reads++
      
      if (value !== null && value !== undefined) {
        metrics.hits++
        console.log(`READ HIT ${key} (${duration}ms)`)
      } else {
        metrics.misses++
        console.log(`READ MISS ${key} (${duration}ms)`)
      }
      
      return value
    } catch (error) {
      metrics.errors++
      console.error(`READ ERROR ${key}`, error)
      throw error
    }
  }
  
  // Method to get current metrics
  storage.getMetrics = () => ({ ...metrics })
  
  return storage
}

// Usage
import { storage } from 'omnichron'
monitorStorage(storage)

// Later, get metrics
const metrics = storage.getMetrics()
console.log(`Cache hit rate: ${(metrics.hits / metrics.reads * 100).toFixed(2)}%`)
```

## Development Tools

A helper to visualize your storage contents:

```js
// Debug utility to inspect storage contents
async function inspectStorage(storage, prefix = '') {
  const keys = await storage.getKeys(prefix)
  
  console.log(`Storage contents (${keys.length} keys)${prefix ? ` with prefix "${prefix}"` : ''}:`)
  
  for (const key of keys.slice(0, 20)) { // Limit to first 20 for brevity
    try {
      const value = await storage.getItem(key)
      const metadata = await storage.getMeta(key)
      const expiry = metadata?.expiry 
        ? new Date(metadata.expiry).toISOString()
        : 'never'
      
      console.log(`- ${key} (expires: ${expiry})`)
      console.log('  Value:', typeof value === 'string' ? value.substring(0, 50) : value)
    } catch (error) {
      console.error(`  Error reading ${key}:`, error.message)
    }
  }
  
  if (keys.length > 20) {
    console.log(`... and ${keys.length - 20} more keys`)
  }
}

// Usage
await inspectStorage(storage, 'wayback:')
```

## Further Resources

- [Unstorage Documentation](https://unstorage.unjs.io/)
- [Unstorage Drivers List](https://unstorage.unjs.io/drivers/)
- [Caching Best Practices](https://web.dev/articles/http-cache)
- [Redis Documentation](https://redis.io/docs/)