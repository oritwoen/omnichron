import { createArchive } from 'omnichron'
import wayback from 'omnichron/providers/wayback'
import archiveToday from 'omnichron/providers/archive-today'
// Uncommment if you need more providers
// import _permacc from 'omnichron/providers/permacc'

try {
  console.log('Single provider example:')
  // Wayback Machine with performance options
  const waybackArchive = createArchive(wayback(), {
    concurrency: 3,
    batchSize: 25,
    timeout: 20000,
    retries: 2,
    limit: 5
  })
  const waybackPages = await waybackArchive.getSnapshots('example.com')
  console.log('Wayback Machine:', waybackPages.pages.length, 'pages')
  console.log(waybackPages.pages[0])
  
  console.log('\nMultiple providers example:')
  // Query multiple providers in parallel
  const multiArchive = createArchive([
    wayback(),
    archiveToday(),
    // Include other providers as needed
    // _permacc()
  ], {
    concurrency: 5,
    batchSize: 30,
    timeout: 30000,
    retries: 3,
    limit: 10
  })
  
  const multiPages = await multiArchive.getSnapshots('example.com')
  console.log('Combined providers found:', multiPages.pages.length, 'pages')
  console.log('Pages per provider:')
  
  // Group by provider
  const byProvider = {}
  for (const page of multiPages.pages) {
    const provider = page.metadata?.provider || 'unknown'
    byProvider[provider] = (byProvider[provider] || 0) + 1
  }
  
  console.log(byProvider)
  console.log('Sample page:', multiPages.pages[0])
} catch (error_) {
  console.error(error_)
}