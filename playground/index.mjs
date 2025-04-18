// @ts-check

import { createArchive } from '../dist/index.mjs'
import wayback from '../dist/providers/wayback.mjs'
import archiveToday from '../dist/providers/archive-today.mjs'

// Wayback Machine
const waybackArchive = createArchive(wayback())
const waybackPages = await waybackArchive.getSnapshots('example.com', { limit: 5 })
console.log('\n--- Wayback Machine ---')
console.log(`Found ${waybackPages.pages.length} pages:`)
console.log(JSON.stringify(waybackPages, undefined, 2))

// Archive.today
const archiveTodayArchive = createArchive(archiveToday())
const archiveTodayPages = await archiveTodayArchive.getSnapshots('example.com')
console.log('\n--- Archive.today ---')
console.log(`Found ${archiveTodayPages.pages.length} pages:`)
console.log(JSON.stringify(archiveTodayPages.pages.slice(0, 2), undefined, 2))