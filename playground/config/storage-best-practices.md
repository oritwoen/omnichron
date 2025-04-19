# Storage Best Practices for Omnichron

This guide provides recommendations for optimizing your storage configuration in Omnichron applications.

## Choosing the Right Storage Driver

| Driver | Best for | Considerations |
|--------|----------|----------------|
| Memory | Development, testing, small datasets | - Data is lost on restart<br>- Limited by available RAM<br>- Fastest performance |
| File system | Local development, persistent storage | - Limited to single machine<br>- Disk I/O can be slow<br>- Simple setup |
| Redis | Production, distributed systems | - Requires Redis server<br>- Very fast, supports clustering<br>- Good for shared caching |
| MongoDB | Large datasets, complex data | - Higher overhead<br>- Good for structured data<br>- Scales well horizontally |
| LRU Cache | Memory-constrained environments | - Automatic cache eviction<br>- Prevents memory leaks<br>- Good for high-churn data |
| Cloudflare KV | Edge computing, global distribution | - Fast global access<br>- Works with Cloudflare Workers<br>- Limited item size |

## Performance Optimization

### TTL Strategies

Adjust TTLs based on the type of data:

```js
// Frequently changing data (short TTL)
await storage.setItem('trending-topics', data, { ttl: 60 * 5 }) // 5 minutes

// Semi-stable data (medium TTL)
await storage.setItem('user-preferences', data, { ttl: 60 * 60 * 24 }) // 1 day

// Reference data (long TTL)
await storage.setItem('supported-countries', data, { ttl: 60 * 60 * 24 * 7 }) // 1 week
```

### Key Design

Well-designed keys improve performance and maintainability:

```js
// Good key design examples
await storage.setItem('user:1234:profile', userProfile)
await storage.setItem('product:electronics:laptops', laptopsList)
await storage.setItem('archive:wayback:example.com:20210315', archiveData)

// Bad key design (avoid)
await storage.setItem('userdata1234', userData) // No namespacing
await storage.setItem('array-of-products-in-electronics-category', products) // Too verbose
await storage.setItem('a', data) // Too short/ambiguous
```

### Batch Operations

When possible, process data in batches:

```js
// Example: Storing multiple items at once
async function storeBatch(items) {
  const promises = items.map(item => 
    storage.setItem(`item:${item.id}`, JSON.stringify(item))
  )
  
  await Promise.all(promises)
}
```

## Multi-Tier Storage Architecture

For production systems, consider a multi-tier approach:

```
┌─────────────┐
│   Memory    │ <- Fast, limited capacity, volatile
├─────────────┤
│ Local Disk  │ <- Medium speed, larger capacity, single-machine
├─────────────┤
│ Redis/Shared│ <- Distributed access, cluster support
├─────────────┤
│ Long-term   │ <- Database, S3, etc. for persistence
└─────────────┘
```

Implementation example:

```js
import { configureStorage, createStorage } from 'omnichron'
import memoryDriver from 'unstorage/drivers/memory'
import fsDriver from 'unstorage/drivers/fs'
import redisDriver from 'unstorage/drivers/redis'
import s3Driver from 'unstorage/drivers/s3'

// Create and configure multi-tier storage
const storage = createStorage()

// Tier 1: Fast in-memory cache (small items, frequent access)
storage.mount('cache', memoryDriver({
  size: 5000 // Limit to 5000 items
}))

// Tier 2: Local filesystem (larger items, persistence between restarts)
storage.mount('local', fsDriver({
  base: './.cache',
  ttl: 60 * 60 * 24 // 1 day
}))

// Tier 3: Shared Redis cache (distributed access)
storage.mount('shared', redisDriver({
  url: process.env.REDIS_URL,
  ttl: 60 * 60 * 24 * 7 // 1 week
}))

// Tier 4: Long-term archive storage (permanent records)
storage.mount('archive', s3Driver({
  bucket: 'my-archive-bucket',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
}))

// Configure Omnichron with this storage
await configureStorage({ driver: storage })
```

## Data Lifecycle Management

Implement strategies for managing the entire data lifecycle:

1. **Data Generation** - Create or fetch the data
2. **Storage** - Store with appropriate TTL
3. **Access Patterns** - Optimize for read/write frequency
4. **Invalidation** - Clear specific items when source data changes
5. **Expiration** - Allow TTL to handle automatic cleanup
6. **Archival** - Move from hot storage to cold storage
7. **Deletion** - Remove data that's no longer needed

Example implementation:

```js
// Data lifecycle management class
class DataLifecycle {
  constructor(storage) {
    this.storage = storage
  }
  
  // 1. Generate/fetch data
  async fetchData(source, params) {
    // Fetch from original source
    // ...
    return data
  }
  
  // 2. Store data with TTL based on data type
  async storeData(key, data, type = 'standard') {
    const ttlMap = {
      volatile: 60 * 5,            // 5 minutes
      standard: 60 * 60 * 24,      // 1 day
      stable: 60 * 60 * 24 * 7,    // 1 week
      reference: 60 * 60 * 24 * 30 // 30 days
    }
    
    const ttl = ttlMap[type] || ttlMap.standard
    await this.storage.setItem(key, JSON.stringify(data), { ttl })
    
    return data
  }
  
  // 3. & 4. Access with smart refresh
  async getData(key, source, params, type = 'standard') {
    // Try to get from cache first
    const cached = await this.storage.getItem(key)
    
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (e) {
        // Invalid JSON, will refetch
      }
    }
    
    // Fetch fresh data
    const freshData = await this.fetchData(source, params)
    
    // Store for next time
    await this.storeData(key, freshData, type)
    
    return freshData
  }
  
  // 5. Invalidate specific items
  async invalidate(keyPattern) {
    const keys = await this.storage.getKeys(keyPattern)
    
    for (const key of keys) {
      await this.storage.removeItem(key)
    }
    
    return keys.length
  }
  
  // 6. Archive data to cold storage
  async archiveData(key, archiveKey) {
    const data = await this.storage.getItem(key)
    
    if (data) {
      // Move to archive storage (prefix indicates storage tier)
      await this.storage.setItem(`archive:${archiveKey || key}`, data, {
        // No TTL for archived data
      })
      
      // Optionally remove from hot storage
      await this.storage.removeItem(key)
      
      return true
    }
    
    return false
  }
  
  // 7. Permanently delete
  async deleteData(keyPattern) {
    return this.invalidate(keyPattern)
  }
}
```

## Error Handling

Implement robust error handling for storage operations:

```js
// Wrap storage operations with error handling
async function safeStorageOp(operation, fallback = null) {
  try {
    return await operation()
  } catch (error) {
    console.error('Storage operation failed:', error)
    return fallback
  }
}

// Example usage
const userData = await safeStorageOp(
  () => storage.getItem('user:1234'), 
  { name: 'Guest' } // Fallback value
)
```

## Monitoring and Diagnostics

Add monitoring to identify performance issues:

```js
// Simple storage monitoring wrapper
function addStorageMonitoring(storage, sampleRate = 0.1) {
  // Only instrument a percentage of operations for performance
  const shouldSample = () => Math.random() < sampleRate
  
  // Track timing metrics
  const metrics = {
    operations: 0,
    errors: 0,
    totalTime: 0,
    maxTime: 0
  }
  
  // Instrument methods
  const originalMethods = {
    getItem: storage.getItem,
    setItem: storage.setItem,
    removeItem: storage.removeItem,
    getKeys: storage.getKeys
  }
  
  // Replace methods with instrumented versions
  Object.keys(originalMethods).forEach(method => {
    const original = originalMethods[method].bind(storage)
    
    storage[method] = async (...args) => {
      // Only sample a percentage of operations
      if (!shouldSample()) {
        return original(...args)
      }
      
      const start = performance.now()
      metrics.operations++
      
      try {
        const result = await original(...args)
        const duration = performance.now() - start
        
        metrics.totalTime += duration
        metrics.maxTime = Math.max(metrics.maxTime, duration)
        
        // Log slow operations
        if (duration > 100) {
          console.warn(`Slow storage operation: ${method} took ${duration.toFixed(2)}ms`)
        }
        
        return result
      } catch (error) {
        metrics.errors++
        console.error(`Storage operation ${method} failed:`, error)
        throw error
      }
    }
  })
  
  // Add method to get metrics
  storage.getMetrics = () => {
    const avgTime = metrics.operations > 0 
      ? metrics.totalTime / metrics.operations 
      : 0
      
    return {
      ...metrics,
      avgTime,
      errorRate: metrics.operations > 0 
        ? metrics.errors / metrics.operations 
        : 0
    }
  }
  
  return storage
}

// Usage
import { storage } from 'omnichron'
addStorageMonitoring(storage)

// Periodically log metrics
setInterval(() => {
  const metrics = storage.getMetrics()
  console.log('Storage metrics:', metrics)
}, 60000) // Every minute
```

## Environment-Specific Configuration

Configure storage differently based on environment:

```js
// In omnichron.config.ts
export default {
  // Default configuration
  storage: {
    driver: memoryDriver(),
    ttl: 3600000 // 1 hour
  },
  
  // Development - short TTLs, memory storage
  $development: {
    storage: {
      ttl: 60000 // 1 minute
    }
  },
  
  // Test - no caching for predictable tests
  $test: {
    storage: {
      cache: false
    }
  },
  
  // Production - Redis for distributed caching
  $production: {
    storage: {
      driver: redisDriver({
        url: process.env.REDIS_URL
      }),
      ttl: 86400000 // 1 day
    }
  }
}
```

## Security Considerations

Keep these security practices in mind:

1. **Sensitive Data** - Avoid storing passwords, tokens or PII in cache
2. **Encryption** - Consider encrypting sensitive cached data
3. **Keys** - Design keys to avoid information disclosure
4. **TTLs** - Set appropriate TTLs for security-sensitive data
5. **Access Control** - Secure Redis and other networked storage with authentication

Example with encryption:

```js
import crypto from 'crypto'

// Encryption wrapper for sensitive data
class EncryptedStorage {
  constructor(storage, encryptionKey) {
    this.storage = storage
    this.algorithm = 'aes-256-gcm'
    
    // Derive key from provided string
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32)
  }
  
  // Encrypt data before storing
  async setItem(key, value, options) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    
    let encrypted = cipher.update(typeof value === 'string' ? value : JSON.stringify(value), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get auth tag for GCM
    const authTag = cipher.getAuthTag().toString('hex')
    
    // Store the encrypted data with IV and auth tag
    const payload = {
      encrypted,
      iv: iv.toString('hex'),
      authTag
    }
    
    await this.storage.setItem(key, JSON.stringify(payload), options)
  }
  
  // Decrypt data after retrieval
  async getItem(key) {
    const payload = await this.storage.getItem(key)
    
    if (!payload) {
      return null
    }
    
    try {
      const { encrypted, iv, authTag } = JSON.parse(payload)
      
      const decipher = crypto.createDecipheriv(
        this.algorithm, 
        this.key, 
        Buffer.from(iv, 'hex')
      )
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption error:', error)
      return null
    }
  }
  
  // Pass through other methods
  async removeItem(key) {
    return this.storage.removeItem(key)
  }
  
  async getKeys(prefix) {
    return this.storage.getKeys(prefix)
  }
}

// Usage
import { configureStorage, storage } from 'omnichron'
import memoryDriver from 'unstorage/drivers/memory'

// Set up encrypted storage
const encryptedStorage = new EncryptedStorage(
  createStorage({ driver: memoryDriver() }),
  process.env.ENCRYPTION_KEY
)

// Configure Omnichron with encrypted storage
await configureStorage({ driver: encryptedStorage })
```

## Testing Storage Configurations

Create test utilities for verifying storage behavior:

```js
// Storage test utility
async function testStorage(storage) {
  console.log('Testing storage configuration...')
  
  // 1. Write test
  console.log('1. Testing write operation...')
  try {
    await storage.setItem('test:key', 'test-value')
    console.log('✓ Write successful')
  } catch (error) {
    console.error('✗ Write failed:', error)
    return false
  }
  
  // 2. Read test
  console.log('2. Testing read operation...')
  try {
    const value = await storage.getItem('test:key')
    if (value === 'test-value') {
      console.log('✓ Read successful')
    } else {
      console.error('✗ Read returned incorrect value:', value)
      return false
    }
  } catch (error) {
    console.error('✗ Read failed:', error)
    return false
  }
  
  // 3. TTL test
  console.log('3. Testing TTL functionality...')
  try {
    await storage.setItem('test:ttl', 'should-expire', { ttl: 1 }) // 1ms TTL
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const expiredValue = await storage.getItem('test:ttl')
    if (expiredValue === null || expiredValue === undefined) {
      console.log('✓ TTL expiration works')
    } else {
      console.warn('⚠ TTL may not be working:', expiredValue)
    }
  } catch (error) {
    console.error('✗ TTL test failed:', error)
  }
  
  // 4. Delete test
  console.log('4. Testing delete operation...')
  try {
    await storage.removeItem('test:key')
    const checkDeleted = await storage.getItem('test:key')
    
    if (checkDeleted === null || checkDeleted === undefined) {
      console.log('✓ Delete successful')
    } else {
      console.error('✗ Delete failed, item still exists')
      return false
    }
  } catch (error) {
    console.error('✗ Delete failed:', error)
    return false
  }
  
  // Clean up any remaining test keys
  const testKeys = await storage.getKeys('test:')
  for (const key of testKeys) {
    await storage.removeItem(key)
  }
  
  console.log('✓ All storage tests passed!')
  return true
}

// Usage
await testStorage(storage)
```

## Further Resources

- [Redis Best Practices](https://redis.io/docs/management/optimization/best-practices/)
- [Caching Strategies](https://www.mnot.net/cache_docs/)
- [Web Caching Basics](https://web.dev/articles/http-cache)
- [Storage Performance Optimization](https://calendar.perfplanet.com/2020/cache-them-if-you-can/)