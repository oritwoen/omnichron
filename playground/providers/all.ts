import { createArchive } from 'omnichron'
import archiveToday from 'omnichron/providers/archive-today'
import commoncrawl from 'omnichron/providers/commoncrawl'
import mementoTime from 'omnichron/providers/memento-time'
import permacc from 'omnichron/providers/permacc'
import ukWebArchive from 'omnichron/providers/uk-web-archive'
import wayback from 'omnichron/providers/wayback'

// Create archive with all providers
const archive = createArchive([
  archiveToday({ timeout: 5000 }),
  commoncrawl({ timeout: 5000 }),
  mementoTime({ timeout: 5000 }),
  permacc({ timeout: 5000 }),
  ukWebArchive({ timeout: 5000 }),
  wayback({ limit: 10 })
])

const domain = 'example.com'
console.log(`Searching snapshots for domain: ${domain}`)

const snapshots = await archive.getSnapshots(domain)

console.log(`Found ${snapshots.pages.length} snapshots from ${snapshots.providers?.length || 0} providers`)

// Display first 5 results (if available)
if (snapshots.pages.length > 0) {
  console.log('\nFirst 5 snapshots:')
  
  // Display first 5 snapshots
  const topPages = snapshots.pages.slice(0, 5)
  for (const [index, page] of topPages.entries()) {
    console.log(`\n[${index + 1}] URL: ${page.url}`)
    console.log(`    Timestamp: ${page.timestamp}`)
    console.log(`    Snapshot: ${page.snapshot}`)
    console.log(`    Provider: ${page._meta?.provider || 'unknown'}`)
  }
}

// Display provider information
if (snapshots.providers?.length) {
  console.log('\nProvider information:')
  
  // Display provider information
  for (const provider of snapshots.providers) {
    console.log(`\n${provider.name} (${provider.slug})`)
    console.log(`  Snapshots: ${provider.count}`)
    console.log(`  Success: ${provider.success}`)
    if (!provider.success && provider.error) {
      console.log(`  Error: ${provider.error}`)
    }
  }
}
