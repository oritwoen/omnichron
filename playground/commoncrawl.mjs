import { createArchive } from 'omnichron'
import commonCrawl from 'omnichron/providers/commoncrawl'

try {
  // Note: Using 'count' instead of 'pageCount' (renamed for consistency)
  console.log('Common Crawl with performance optimizations:')
  
  const archive = createArchive(
    commonCrawl({ 
      collection: 'CC-MAIN-2023-50',
      count: 50 // Renamed from pageCount to count for consistency
    }),
    {
      // Performance options
      concurrency: 5,
      batchSize: 25,
      timeout: 30000,
      retries: 3,
      
      // Cache options
      cache: true
    }
  )
  
  console.time('CommonCrawl query')
  const result = await archive.getSnapshots('example.com')
  console.timeEnd('CommonCrawl query')
  
  console.log('Common Crawl found', result.pages.length, 'pages')
  console.log('Results processed in batches of', archive.options.batchSize)
  console.log('With concurrency level of', archive.options.concurrency)
  
  console.log('\nMetadata:')
  console.log('- Provider:', result.metadata?.provider)
  console.log('- Collection:', result.metadata?.collection)
  console.log('- From cache:', result.fromCache ? 'Yes' : 'No')
  
  console.log('\nSample pages:')
  for (const page of result.pages.slice(0, 3)) {
    console.log({
      url: page.url,
      timestamp: page.timestamp,
      snapshot: page.snapshot,
      crawlDate: page.metadata?.crawlDate || 'unknown'
    })
  }
  
  // Demonstrate batch processing benefit
  if (result.pages.length > 10) {
    console.log('\nProcessing all pages with custom function:')
    console.time('Batch processing')
    
    let totalSize = 0
    const batchedPages = []
    
    // Process in batches of 10
    for (let i = 0; i < result.pages.length; i += 10) {
      const batch = result.pages.slice(i, i + 10)
      
      // Simulate processing
      for (const page of batch) {
        totalSize += page.url.length + (page.snapshot?.length || 0)
      }
      
      batchedPages.push(...batch)
    }
    
    console.timeEnd('Batch processing')
    console.log(`Processed ${batchedPages.length} pages with total size of ${totalSize} bytes`)
  }
} catch (error_) {
  console.error('Error:', error_.message)
  if (error_.cause) console.error('Cause:', error_.cause)
}
