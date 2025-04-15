// @ts-check

import { createArchive } from 'omnichron'
import wayback from 'omnichron/providers/wayback'

// Simple test for retrieving data from Wayback Machine
const waybackArchive = createArchive(wayback())
const pages = await waybackArchive.getSnapshots('example.com', { 
  limit: 10  // Result limit
})

console.log(`\nWayback Machine - found ${pages.pages.length} pages:`)

// Display standard fields
console.log('\n--- Standard data ---')
for (const page of pages.pages) {
  console.log(`- ${page.url} (${new Date(page.timestamp).toLocaleDateString()})`)
  console.log(`  Snapshot: ${page.snapshot}`)
}

// Display provider-specific data
console.log('\n--- Provider-specific metadata ---')
for (const page of pages.pages) {
  console.log(`- Status: ${page._meta.status}, Timestamp: ${page._meta.timestamp}`)
}

// Display response metadata
console.log('\n--- Response metadata ---')
console.log(pages._meta)
