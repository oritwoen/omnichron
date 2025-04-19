import { createArchive } from 'omnichron'
import permacc from 'omnichron/providers/permacc'

const API_KEY = 'YOUR_API_KEY'

try {
  if (API_KEY === 'YOUR_API_KEY') {
    console.warn('Please set your Perma.cc API key')
  } else {
    console.log('Perma.cc with performance and caching options:')
    
    // Create archive with performance settings
    const archive = createArchive(
      permacc({ 
        apiKey: API_KEY, 
        count: 5 // Using count instead of limit (renamed for consistency)
      }),
      {
        // Performance options
        concurrency: 3,
        timeout: 20000, 
        retries: 2,
        
        // Cache options
        cache: true,
        ttl: 3600000 // 1 hour cache
      }
    )
    
    console.time('Perma.cc query')
    const result = await archive.getSnapshots('example.com')
    console.timeEnd('Perma.cc query')
    
    console.log('Perma.cc found', result.pages.length, 'pages')
    console.log('Performance settings:')
    console.log('- Concurrency:', archive.options.concurrency)
    console.log('- Timeout:', archive.options.timeout, 'ms')
    console.log('- Retries:', archive.options.retries)
    console.log('- Cache enabled:', archive.options.cache ? 'Yes' : 'No')
    
    console.log('\nMetadata:')
    console.log('- Provider:', result.metadata?.provider)
    console.log('- From cache:', result.fromCache ? 'Yes' : 'No')
    console.log('- Query time:', result.metadata?.queryTime, 'ms')
    
    if (result.pages.length > 0) {
      console.log('\nSample pages:')
      for (const page of result.pages.slice(0, 3)) {
        console.log({
          url: page.url,
          timestamp: page.timestamp,
          snapshot: page.snapshot,
          archivedBy: page.metadata?.archivedBy || 'unknown'
        })
      }
    }
  }
} catch (error_) {
  console.error('Error:', error_.message)
  if (error_.cause) console.error('Cause:', error_.cause)
}
