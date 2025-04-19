import { createArchive, configureStorage, storage } from 'omnichron'
import wayback from 'omnichron/providers/wayback'
import memoryDriver from 'unstorage/drivers/memory'

try {
  // In-memory storage setup with TTL and prefix
  configureStorage({ 
    driver: memoryDriver(), 
    cache: true,
    ttl: 3600000, // 1 hour storage TTL
    prefix: 'omni-playground' // Custom prefix for storage keys
  })
  
  const archive = createArchive(wayback(), {
    // Combined performance and caching options
    concurrency: 3,
    batchSize: 20,
    timeout: 15000,
    retries: 2,
    limit: 5,
    cache: true,
    ttl: 1800000 // Override TTL for this specific archive (30 min)
  })
  
  const domain = 'example.com'

  console.log('First fetch (API)')
  console.time('First fetch')
  const first = await archive.getSnapshots(domain)
  console.timeEnd('First fetch')
  console.log('fromCache:', first.fromCache, 'pages:', first.pages.length)

  console.log('\nSecond fetch (cache)')
  console.time('Second fetch')
  const second = await archive.getSnapshots(domain)
  console.timeEnd('Second fetch')
  console.log('fromCache:', second.fromCache, 'pages:', second.pages.length)
  console.log('Cache hit performance improvement demonstrated')

  console.log('\nClearing cache')
  await storage.clear()

  console.log('\nThird fetch (after clear)')
  console.time('Third fetch')
  const third = await archive.getSnapshots(domain)
  console.timeEnd('Third fetch')
  console.log('fromCache:', third.fromCache, 'pages:', third.pages.length)
  
  // Demonstrate multiple provider caching
  console.log('\nMultiple providers with cache')
  const multiArchive = createArchive([
    wayback(),
    wayback({ prefix: 'mobile', userAgent: 'Mozilla/5.0 Mobile' }) // Same provider with different config
  ], { 
    cache: true,
    concurrency: 2
  })
  
  console.time('Multi-provider fetch')
  const multiResult = await multiArchive.getSnapshots(domain, { limit: 3 })
  console.timeEnd('Multi-provider fetch')
  console.log('Total cached pages:', multiResult.pages.length)
  
} catch (error_) {
  console.error(error_)
}
