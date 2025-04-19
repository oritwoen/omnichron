import { createArchive, configureCache } from 'omnichron'
import wayback from 'omnichron/providers/wayback'
import archiveToday from 'omnichron/providers/archive-today'
import permacc from 'omnichron/providers/permacc'
import ukWebArchive from 'omnichron/providers/uk-web-archive'
import commonCrawl from 'omnichron/providers/commoncrawl'
import memoryDriver from 'unstorage/drivers/memory'

// Configure cache with memory driver
configureCache({ driver: memoryDriver(), cache: true })

// Helper to format timestamp
const formatDate = (timestamp) => {
  if (!timestamp) return 'unknown'
  try {
    const date = new Date(timestamp)
    return date.toISOString().split('T')[0]
  } catch {
    return timestamp
  }
}

try {
  console.log('Multi-provider performance demo\n')
  console.log('This example shows how to query multiple archive providers in parallel')
  console.log('with performance optimizations for reduced memory usage and faster results.\n')
  
  // Create a multi-provider archive with performance options
  const multiArchive = createArchive([
    wayback(),
    archiveToday(),
    ukWebArchive(),
    commonCrawl({ collection: 'CC-MAIN-2023-50' })
  ], {
    // Performance settings
    concurrency: 6,      // Process 6 requests concurrently (across all providers)
    batchSize: 30,       // Process data in batches of 30 items
    timeout: 30000,      // 30 second timeout for all requests
    retries: 2,          // Retry failed requests twice
    
    // Regular options
    limit: 20,           // Limit results per provider
    cache: true          // Enable caching
  })
  
  const targetUrl = 'example.com'
  
  console.log(`Fetching archives for ${targetUrl} from multiple providers...`)
  console.time('Total query time')
  
  const result = await multiArchive.getSnapshots(targetUrl)
  
  console.timeEnd('Total query time')
  console.log(`Found ${result.pages.length} total snapshots across all providers\n`)
  
  // Count pages by provider
  const providerCounts = result.pages.reduce((acc, page) => {
    const provider = page.metadata?.provider || 'unknown'
    acc[provider] = (acc[provider] || 0) + 1
    return acc
  }, {})
  
  console.log('Snapshots by provider:')
  Object.entries(providerCounts).forEach(([provider, count]) => {
    console.log(`- ${provider}: ${count} snapshots`)
  })
  
  // Group by year to see time distribution
  const yearCounts = result.pages.reduce((acc, page) => {
    if (!page.timestamp) return acc
    
    try {
      const year = new Date(page.timestamp).getFullYear()
      acc[year] = (acc[year] || 0) + 1
    } catch {
      acc['unknown'] = (acc['unknown'] || 0) + 1
    }
    
    return acc
  }, {})
  
  console.log('\nSnapshots by year:')
  Object.entries(yearCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([year, count]) => {
      console.log(`- ${year}: ${count} snapshots`)
    })
  
  // Show sample results from each provider
  console.log('\nSample snapshots by provider:')
  const samplesByProvider = {}
  
  result.pages.forEach(page => {
    const provider = page.metadata?.provider || 'unknown'
    if (!samplesByProvider[provider]) {
      samplesByProvider[provider] = page
    }
  })
  
  Object.entries(samplesByProvider).forEach(([provider, page]) => {
    console.log(`\n${provider}:`)
    console.log({
      url: page.url,
      date: formatDate(page.timestamp),
      snapshot: page.snapshot?.substring(0, 50) + (page.snapshot?.length > 50 ? '...' : ''),
      mimeType: page.metadata?.mimeType || 'unknown'
    })
  })
  
  // Performance metrics
  console.log('\nPerformance metrics:')
  console.log('- Query time:', result.metadata?.queryTime || 'unknown', 'ms')
  console.log('- From cache:', result.fromCache ? 'Yes' : 'No')
  console.log('- Concurrency:', multiArchive.options.concurrency)
  console.log('- Batch size:', multiArchive.options.batchSize)
  
  // Demo batch processing performance
  console.log('\nProcessing all snapshots...')
  
  console.time('Sequential processing')
  for (const page of result.pages) {
    // Simulate processing work
    const data = page.url + (page.snapshot || '')
    const hash = [...data].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)
    if (hash === Infinity) console.log('Impossible!')
  }
  console.timeEnd('Sequential processing')
  
  console.time('Batched processing')
  const batchSize = Math.ceil(result.pages.length / 5) // 5 batches
  
  for (let i = 0; i < result.pages.length; i += batchSize) {
    const batch = result.pages.slice(i, i + batchSize)
    
    for (const page of batch) {
      const data = page.url + (page.snapshot || '')
      const hash = [...data].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)
      if (hash === Infinity) console.log('Impossible!')
    }
  }
  console.timeEnd('Batched processing')
  
  console.log(`\nProcessed ${result.pages.length} snapshots in batches of ${batchSize}`)
  
} catch (error_) {
  console.error('Error:', error_.message)
  if (error_.cause) console.error('Cause:', error_.cause)
}