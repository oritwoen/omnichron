import { createArchive } from 'omnichron'
import createMementoTime from 'omnichron/providers/memento-time'

// Create a standalone Memento Time Travel provider
const mementoTimeProvider = createMementoTime()
const archive = createArchive(mementoTimeProvider)

// Example 1: Get snapshots for a domain
console.log('Getting archived snapshots for example.com...')
const result = await archive.getSnapshots('example.com', { limit: 10 })

if (result.success) {
  console.log(`Found ${result.pages.length} snapshots:`)
  
  // Display each snapshot with its source archive and date
  for (const [i, page] of result.pages.entries()) {
    const date = new Date(page.timestamp).toLocaleDateString()
    console.log(`${i + 1}. [${page._meta.source || 'unknown'}] ${date} - ${page.snapshot}`)
  }
} else {
  console.error('Error fetching snapshots:', result.error)
}

// Example 2: Using Memento Time Travel within a multi-provider setup
import createWayback from 'omnichron/providers/wayback'
import createArchiveToday from 'omnichron/providers/archive-today'

// Create a multi-provider archive with Memento Time Travel and other providers
const multiArchive = createArchive([
  mementoTimeProvider,
  createWayback(),
  createArchiveToday()
])

console.log('\nFetching snapshots from multiple providers...')
const multiResult = await multiArchive.getSnapshots('example.com', { 
  limit: 5,
  concurrency: 3  // Query 3 providers simultaneously
})

if (multiResult.success) {
  console.log(`Found ${multiResult.pages.length} snapshots across ${multiResult._meta.providerCount} providers`)
  
  // Display the first 5 snapshots
  for (const [i, page] of multiResult.pages.slice(0, 5).entries()) {
    const date = new Date(page.timestamp).toLocaleDateString()
    const provider = page._meta.provider || page._meta.source || 'unknown'
    console.log(`${i + 1}. [${provider}] ${date} - ${page.snapshot}`)
  }
} else {
  console.error('Error fetching multi-provider snapshots:', multiResult.error)
}