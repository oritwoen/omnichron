import { createArchive } from 'omnichron'
import ukWebArchive from 'omnichron/providers/uk-web-archive'

try {
  console.log('UK Web Archive with batch processing demo:')
  
  // Create archive with performance settings
  const archive = createArchive(
    ukWebArchive(),
    {
      // Performance options
      concurrency: 4,     // Process 4 requests concurrently
      batchSize: 20,      // Process results in batches of 20
      timeout: 25000,     // 25 second timeout
      retries: 2,         // Retry failed requests twice
      
      // Regular options
      limit: 10,          // Limit results 
      cache: true         // Enable caching
    }
  )
  
  // Measure execution time
  console.time('UK Web Archive query')
  const result = await archive.getSnapshots('example.com')
  console.timeEnd('UK Web Archive query')
  
  console.log('UK Web Archive found', result.pages.length, 'pages')
  
  // Display performance metrics
  console.log('\nPerformance configuration:')
  console.log('- Batch size:', archive.options.batchSize)
  console.log('- Concurrency:', archive.options.concurrency) 
  console.log('- Timeout:', archive.options.timeout, 'ms')
  console.log('- Retries:', archive.options.retries)
  
  // Display result metadata
  console.log('\nResult metadata:')
  console.log('- Provider:', result.metadata?.provider)
  console.log('- From cache:', result.fromCache ? 'Yes' : 'No')
  console.log('- Query time:', result.metadata?.queryTime, 'ms')
  
  // Display a few sample results
  if (result.pages.length > 0) {
    console.log('\nSample pages:')
    for (const page of result.pages.slice(0, 3)) {
      console.log({
        url: page.url,
        timestamp: page.timestamp,
        snapshot: page.snapshot,
        // Show additional metadata if available
        status: page.metadata?.statusCode || 'unknown',
        mimeType: page.metadata?.mimeType || 'unknown' 
      })
    }
    
    // Demonstrate parallel processing benefit
    if (result.pages.length > 1) {
      console.log('\nProcessing demonstration:')
      
      // Sequential processing simulation
      console.time('Sequential processing')
      for (const page of result.pages) {
        // Simulate some processing work
        const data = page.url + (page.snapshot || '')
        const hash = [...data].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)
        // Just to prevent optimization
        if (hash === Infinity) console.log('Impossible!')
      }
      console.timeEnd('Sequential processing')
      
      // Parallel processing simulation (using batches)
      console.time('Batched processing')
      const batchSize = Math.max(1, Math.ceil(result.pages.length / 2))
      const batches = []
      
      for (let i = 0; i < result.pages.length; i += batchSize) {
        batches.push(result.pages.slice(i, i + batchSize))
      }
      
      // Process each batch (in real code this would be in parallel)
      for (const batch of batches) {
        for (const page of batch) {
          const data = page.url + (page.snapshot || '')
          const hash = [...data].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)
          if (hash === Infinity) console.log('Impossible!')
        }
      }
      console.timeEnd('Batched processing')
      
      console.log(`Processed ${result.pages.length} pages in batches of ${batchSize}`)
    }
  }
} catch (error_) {
  console.error('Error:', error_.message)
  if (error_.cause) console.error('Cause:', error_.cause)
}
