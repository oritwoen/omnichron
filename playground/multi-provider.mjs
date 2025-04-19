import { createArchive, configureCache } from 'omnichron'
import wayback from 'omnichron/providers/wayback'
import archiveToday from 'omnichron/providers/archive-today'
// Uncommment if you need more providers
// import _permacc from 'omnichron/providers/permacc'
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
  const providerCounts = {}
  for (const page of result.pages) {
    const provider = page.metadata?.provider || 'unknown'
    providerCounts[provider] = (providerCounts[provider] || 0) + 1
  }
  
  console.log('Snapshots by provider:')
  for (const [provider, count] of Object.entries(providerCounts)) {
    console.log(`- ${provider}: ${count} snapshots`)
  }
  
  // Group by year to see time distribution
  const yearCounts = {}
  for (const page of result.pages) {
    if (!page.timestamp) continue
    
    try {
      const year = new Date(page.timestamp).getFullYear()
      yearCounts[year] = (yearCounts[year] || 0) + 1
    } catch {
      yearCounts['unknown'] = (yearCounts['unknown'] || 0) + 1
    }
  }
  
  console.log('\nSnapshots by year:')
  for (const [year, count] of Object.entries(yearCounts)
    .sort(([a], [b]) => a.localeCompare(b))) {
      console.log(`- ${year}: ${count} snapshots`)
    }
  
  // Show sample results from each provider
  console.log('\nSample snapshots by provider:')
  const samplesByProvider = {}
  
  for (const page of result.pages) {
    const provider = page.metadata?.provider || 'unknown'
    if (!samplesByProvider[provider]) {
      samplesByProvider[provider] = page
    }
  }
  
  for (const [provider, page] of Object.entries(samplesByProvider)) {
    console.log(`\n${provider}:`)
    console.log({
      url: page.url,
      date: formatDate(page.timestamp),
      snapshot: page.snapshot?.slice(0, 50) + (page.snapshot?.length > 50 ? '...' : ''),
      mimeType: page.metadata?.mimeType || 'unknown'
    })
  }
  
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
    // Compute hash using codePointAt instead of charCodeAt for better Unicode support
    let hash = 0
    for (const c of data) {
      hash = (hash << 5) - hash + c.codePointAt(0)
    }
    if (hash === Infinity) console.log('Impossible!')
  }
  console.timeEnd('Sequential processing')
  
  console.time('Batched processing')
  const batchSize = Math.ceil(result.pages.length / 5) // 5 batches
  
  for (let i = 0; i < result.pages.length; i += batchSize) {
    const batch = result.pages.slice(i, i + batchSize)
    
    for (const page of batch) {
      const data = page.url + (page.snapshot || '')
      const hash = [...data].reduce((h, c) => (h << 5) - h + c.codePointAt(0), 0)
      if (hash === Infinity) console.log('Impossible!')
    }
  }
  console.timeEnd('Batched processing')
  
  console.log(`\nProcessed ${result.pages.length} snapshots in batches of ${batchSize}`)
  
} catch (error_) {
  console.error('Error:', error_.message)
  if (error_.cause) console.error('Cause:', error_.cause)
}