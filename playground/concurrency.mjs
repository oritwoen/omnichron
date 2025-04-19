import { createArchive } from 'omnichron'
import wayback from 'omnichron/providers/wayback'
import archiveToday from 'omnichron/providers/archive-today'
// Uncommment if you need more providers
// import _permacc from 'omnichron/providers/permacc'

/**
 * This example demonstrates the concurrency control features
 * for optimizing request performance and rate limiting
 */

try {
  console.log('Concurrency Control Demo\n')
  console.log('This example shows how different concurrency settings')
  console.log('affect performance when making multiple archive requests.\n')
  
  const domains = [
    'example.com',
    'mozilla.org',
    'wikipedia.org',
    'github.com',
    'cloudflare.com'
  ]
  
  // Test with different concurrency settings
  const concurrencyLevels = [1, 3, 5]
  const results = {}
  
  // Run sequential test first (concurrency = 1)
  for (const concurrency of concurrencyLevels) {
    console.log(`\nTesting with concurrency level: ${concurrency}`)
    
    const archive = createArchive(wayback(), { 
      concurrency,
      timeout: 15000,
      retries: 1,
      limit: 5
    })
    
    // Measure performance across multiple domains
    console.time(`Concurrency ${concurrency} total`)
    const startTime = Date.now()
    
    const snapshots = []
    for (const domain of domains) {
      console.log(`Fetching ${domain}...`)
      console.time(`${domain} fetch`)
      const result = await archive.getSnapshots(domain)
      console.timeEnd(`${domain} fetch`)
      snapshots.push({
        domain,
        count: result.pages.length,
        time: result.metadata?.queryTime || 'unknown'
      })
    }
    
    const totalTime = Date.now() - startTime
    console.timeEnd(`Concurrency ${concurrency} total`)
    
    // Store results
    results[concurrency] = {
      snapshots,
      totalTime
    }
    
    // Print summary for this concurrency level
    console.log('\nResults:')
    for (const snap of snapshots) {
      console.log(`- ${snap.domain}: ${snap.count} snapshots in ${snap.time} ms`)
    }
    console.log(`Total time: ${totalTime} ms`)
  }
  
  // Compare performance
  console.log('\n--- Performance Comparison ---')
  console.log('Concurrency | Total Time (ms) | Improvement')
  console.log('------------------------------------------------')
  
  const baseTime = results[1].totalTime
  for (const level of concurrencyLevels) {
    const time = results[level].totalTime
    const improvement = level === 1 ? 'baseline' : 
      `${Math.round((baseTime - time) / baseTime * 100)}% faster`
    
    console.log(`     ${level}      |     ${time.toString().padStart(6)}     | ${improvement}`)
  }
  
  // Multi-provider example
  console.log('\n--- Multi-Provider with Concurrency Control ---')
  
  // Create archive with multiple providers and concurrency control
  const multiArchive = createArchive([
    wayback(),
    archiveToday()
  ], { 
    concurrency: 4,
    timeout: 20000,
    retries: 2,
    limit: 10
  })
  
  console.log('\nQuerying multiple providers with concurrency = 4')
  console.time('Multi-provider query')
  const multiResult = await multiArchive.getSnapshots('example.org')
  console.timeEnd('Multi-provider query')
  
  // Group by provider
  const byProvider = {}
  for (const page of multiResult.pages) {
    const provider = page.metadata?.provider || 'unknown'
    byProvider[provider] = (byProvider[provider] || 0) + 1
  }
  
  console.log(`\nFound ${multiResult.pages.length} total snapshots:`)
  for (const [provider, count] of Object.entries(byProvider)) {
    console.log(`- ${provider}: ${count} snapshots`)
  }
  
  console.log('\nConcurrency control allows you to:')
  console.log('1. Limit server load when making multiple requests')
  console.log('2. Prevent rate limiting by respecting server capacity')
  console.log('3. Optimize performance based on available resources')
  console.log('4. Balance speed against stability for your use case')
  
} catch (error_) {
  console.error('Error:', error_.message)
  if (error_.cause) console.error('Cause:', error_.cause)
}