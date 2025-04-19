import { createArchive } from 'omnichron'
import wayback from 'omnichron/providers/wayback'

try {
  console.log('Wayback Machine with performance options:')
  // Create archive with performance tuning
  const archive = createArchive(wayback(), {
    // Performance options
    concurrency: 4,     // Number of concurrent requests
    batchSize: 30,      // Process results in batches of 30 
    timeout: 25000,     // 25 second timeout
    retries: 2,         // Retry failed requests twice
    
    // Regular options
    limit: 10           // Limit results to 10 snapshots
  })
  
  // Measure performance
  console.time('Query execution')
  const result = await archive.getSnapshots('example.com')
  console.timeEnd('Query execution')
  
  console.log('Wayback Machine found', result.pages.length, 'pages')
  console.log('Performance metadata:')
  console.log('- Provider:', result.metadata?.provider)
  console.log('- Query time:', result.metadata?.queryTime, 'ms')
  console.log('- Request count:', result.metadata?.requests || 'N/A')
  
  console.log('\nSample pages:')
  for (const page of result.pages.slice(0, 3)) {
    console.log({
      url: page.url,
      timestamp: page.timestamp,
      snapshot: page.snapshot,
      mimeType: page.metadata?.mimeType || 'unknown',
      statusCode: page.metadata?.statusCode || 'unknown'
    })
  }
} catch (error_) {
  console.error('Error:', error_.message)
  if (error_.cause) console.error('Cause:', error_.cause)
}