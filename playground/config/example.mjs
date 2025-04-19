import { getConfig, resetConfig, configureStorage, createStorage } from 'omnichron'
import fsDriver from 'unstorage/drivers/fs'
import memoryDriver from 'unstorage/drivers/memory'
import lruCacheDriver from 'unstorage/drivers/lru-cache'
// Uncomment these imports if you need them and have installed the required packages
// import mongodbDriver from 'unstorage/drivers/mongodb'
// import cloudflareKVDriver from 'unstorage/drivers/cloudflare-kv'
// import vercelKVDriver from 'unstorage/drivers/vercel-kv'

// This example shows how to configure and use Omnichron with different storage options

async function main() {
  try {
    console.log('Omnichron Configuration Examples\n')
    
    // =====================================================
    // 1. Loading configurations from different sources
    // =====================================================
    
    console.log('1. Configuration Sources\n')
    
    // 1.1 Load configuration from file
    console.log('1.1 Loading configuration from file:')
    const configFromFile = await getConfig({
      cwd: __dirname // Look for config in this directory
    })
    console.log('Storage TTL:', configFromFile.storage.ttl)
    console.log('Storage Driver:', configFromFile.storage.driver?.name || 'memory')
    console.log('Performance Concurrency:', configFromFile.performance.concurrency)
    
    // Reset config between examples
    resetConfig()
    
    // 1.2 Configuration with programmatic overrides
    console.log('\n1.2 Using programmatic configuration overrides:')
    const configWithOverrides = await getConfig({
      overrides: {
        storage: {
          driver: fsDriver({ base: './.temp-cache' }),
          ttl: 3600000 // 1 hour
        },
        performance: {
          concurrency: 10,
          timeout: 5000
        }
      }
    })
    console.log('Storage TTL:', configWithOverrides.storage.ttl)
    console.log('Storage Driver:', configWithOverrides.storage.driver.name || 'fs')
    console.log('Performance Concurrency:', configWithOverrides.performance.concurrency)
    
    // Reset config again
    resetConfig()
    
    // 1.3 Loading from specific config file
    console.log('\n1.3 Loading from specific config file:')
    const configFromSpecificFile = await getConfig({
      configFile: './omnichron.config.ts'
    })
    console.log('Storage TTL:', configFromSpecificFile.storage.ttl)
    console.log('Performance Concurrency:', configFromSpecificFile.performance.concurrency)
    
    resetConfig()
    
    // =====================================================
    // 2. Environment-specific configuration
    // =====================================================
    
    console.log('\n2. Environment-specific configuration:')
    
    // Store original environment
    const originalEnv = process.env.NODE_ENV
    
    // 2.1 Development environment
    process.env.NODE_ENV = 'development'
    resetConfig() // Reset for new env to take effect
    
    const devConfig = await getConfig()
    console.log('\n2.1 Development config:')
    console.log('- Storage TTL:', devConfig.storage.ttl)
    console.log('- Performance Concurrency:', devConfig.performance.concurrency)
    console.log('- Performance Timeout:', devConfig.performance.timeout)
    
    // 2.2 Production environment
    process.env.NODE_ENV = 'production'
    resetConfig() // Reset for new env to take effect
    
    const prodConfig = await getConfig()
    console.log('\n2.2 Production config:')
    console.log('- Storage TTL:', prodConfig.storage.ttl)
    console.log('- Performance Concurrency:', prodConfig.performance.concurrency)
    
    // 2.3 Test environment
    process.env.NODE_ENV = 'test'
    resetConfig() // Reset for new env to take effect
    
    const testConfig = await getConfig()
    console.log('\n2.3 Test config:')
    console.log('- Storage TTL:', testConfig.storage.ttl)
    console.log('- Storage Prefix:', testConfig.storage.prefix)
    console.log('- Performance Timeout:', testConfig.performance.timeout)
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv
    resetConfig()
    
    // =====================================================
    // 3. Storage driver examples
    // =====================================================
    
    console.log('\n3. Storage driver examples:')
    
    // 3.1 Memory driver (default)
    console.log('\n3.1 Memory driver (default, no persistence):')
    await configureStorage({
      driver: memoryDriver({
        size: 500 // Limit to 500 items
      }),
      prefix: 'memory-example'
    })
    
    // Add example item to storage to demonstrate
    const memoryKey = 'example-key'
    const memoryValue = { timestamp: Date.now(), value: 'This is stored in memory' }
    
    // Use the globally configured storage (you'd normally use the high-level API)
    const { storage } = await import('../src/storage.js')
    await storage.setItem(memoryKey, JSON.stringify(memoryValue))
    
    // Retrieve the value
    const retrievedMemoryValue = await storage.getItem(memoryKey)
    console.log(`Memory storage example: ${retrievedMemoryValue ? 'Success' : 'Failed'}`)
    
    // Reset configuration
    resetConfig()
    
    // 3.2 File system driver
    console.log('\n3.2 File system driver (persistent on disk):')
    await configureStorage({
      driver: fsDriver({
        base: './.temp-cache', // Path for cache files
        ttl: 3600,            // 1 hour TTL (in seconds)
        ignore: ['.DS_Store', 'Thumbs.db']
      }),
      prefix: 'fs-example'
    })
    
    // Add example item
    const fsKey = 'example-fs-key'
    const fsValue = { timestamp: Date.now(), value: 'This is stored on disk' }
    await storage.setItem(fsKey, JSON.stringify(fsValue))
    
    // Retrieve the value
    const retrievedFsValue = await storage.getItem(fsKey)
    console.log(`Filesystem storage example: ${retrievedFsValue ? 'Success' : 'Failed'}`)
    console.log(`Data stored in: ${process.cwd()}/.temp-cache`)
    
    // Reset configuration
    resetConfig()
    
    // 3.3 LRU Cache driver
    console.log('\n3.3 LRU Cache driver (memory with item limit):')
    await configureStorage({
      driver: lruCacheDriver({
        max: 100,     // Maximum 100 items
        ttl: 60 * 5   // 5 minutes in seconds
      }),
      prefix: 'lru-example'
    })
    
    // Add example item
    const lruKey = 'example-lru-key'
    const lruValue = { timestamp: Date.now(), value: 'This is stored in LRU cache' }
    await storage.setItem(lruKey, JSON.stringify(lruValue))
    
    // Retrieve the value
    const retrievedLruValue = await storage.getItem(lruKey)
    console.log(`LRU Cache storage example: ${retrievedLruValue ? 'Success' : 'Failed'}`)
    
    // Reset configuration
    resetConfig()
    
    // 3.4 Redis driver (commented - requires Redis server)
    console.log('\n3.4 Redis driver example (requires Redis server):')
    console.log('```js')
    console.log(`await configureStorage({
  driver: redisDriver({
    url: 'redis://localhost:6379',
    ttl: 60 * 60,                 // 1 hour in seconds
    base: 'omnichron:',           // Key prefix
    cluster: false                // Use Redis cluster mode
  }),
  prefix: 'redis-example'
})`)
    console.log('```')
    
    // =====================================================
    // 4. Advanced storage configuration
    // =====================================================
    
    console.log('\n4. Advanced storage configuration:')
    
    // 4.1 Custom storage with multiple drivers
    console.log('\n4.1 Multiple storage drivers with mountpoints:')
    
    // Create a custom storage instance with multiple drivers
    const customStorage = createStorage()
    
    // Mount different drivers to different paths
    customStorage.mount('temp', memoryDriver({
      size: 100 // Small memory cache for temporary data
    }))
    
    customStorage.mount('disk', fsDriver({
      base: './.temp-cache/persistent',
      ttl: 60 * 60 * 24 // 1 day in seconds
    }))
    
    // Store values in different mount points
    await customStorage.setItem('temp:example', 'Memory-only temporary data')
    await customStorage.setItem('disk:example', 'Persistent data stored on disk')
    
    // Retrieve values
    const tempValue = await customStorage.getItem('temp:example')
    const diskValue = await customStorage.getItem('disk:example')
    
    console.log(`Temporary storage example: ${tempValue ? 'Success' : 'Failed'}`)
    console.log(`Persistent storage example: ${diskValue ? 'Success' : 'Failed'}`)
    
    // =====================================================
    // 5. Storage with Archive
    // =====================================================
    
    console.log('\n5. Using storage with Archive (commented):')
    console.log('```js')
    console.log(`// Create archive with custom storage configuration
const archive = createArchive(wayback(), {
  // These options override the global configuration for this archive
  limit: 5,
  cache: true,
  ttl: 60000, // 1 minute TTL
  concurrency: 2
})

// Get snapshots for a domain
const domain = 'example.com'
const snapshots = await archive.getSnapshots(domain)
console.log(\`Found \${snapshots.pages.length} snapshots for \${domain}\`)
    `)
    console.log('```')
    
    // Actual Archive example (commented out to avoid making API calls)
    /*
    // Uncomment to run a real example with the Wayback Machine
    const archive = createArchive(wayback(), {
      limit: 5,
      cache: true,
      ttl: 60000, // 1 minute TTL
      concurrency: 2
    })
    
    const domain = 'example.com'
    const snapshots = await archive.getSnapshots(domain)
    console.log(`Found ${snapshots.pages.length} snapshots for ${domain}`)
    */
    
    // =====================================================
    // 6. Additional Resources
    // =====================================================
    
    console.log('\n6. Additional Documentation:')
    console.log('For more detailed information, check these files:')
    console.log('- README.md - Basic configuration guide')
    console.log('- advanced-storage.md - Advanced storage techniques')
    console.log('- storage-best-practices.md - Performance and security recommendations')
    
  } catch (error) {
    console.error('Error:', error)
    console.error(error.stack)
  }
}

// Use top-level await instead of wrapping in an async function and calling it
await main()