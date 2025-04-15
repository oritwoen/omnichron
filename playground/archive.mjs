// @ts-check

import { createArchive } from 'omnichron'
import archive from 'omnichron/providers/archive-today'

// Simple test for retrieving data from Archive.today
const archiveToday = createArchive(archive())
const pages = await archiveToday.getSnapshots('example.com')

console.log(`\nArchive.today - found ${pages.pages.length} pages:`)

// Display standard fields
console.log('\n--- Standard data ---')
for (const page of pages.pages.slice(0, 5)) {
  console.log(`- ${page.url} (${new Date(page.timestamp).toLocaleDateString()})`)
  console.log(`  Snapshot: ${page.snapshot}`)
}

// Display provider-specific data
console.log('\n--- Provider-specific metadata ---')
for (const page of pages.pages.slice(0, 5)) {
  console.log(`- Hash: ${page._meta.hash}, Raw date: ${page._meta.raw_date}`)
}

// Display response metadata
console.log('\n--- Response metadata ---')
console.log(pages._meta)
