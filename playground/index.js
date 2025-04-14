// @ts-check

import { createArchive, platforms } from 'omnichron'

// Wayback Machine
const waybackArchive = createArchive(platforms.wayback)
const waybackPages = await waybackArchive.getSnapshots('example.com', { limit: 5 })
console.log('\n--- Wayback Machine ---')
console.log(`Znaleziono ${waybackPages.pages.length} stron:`)
console.log(JSON.stringify(waybackPages, undefined, 2))

// Archive.today
const archiveTodayArchive = createArchive(platforms.archive)
const archiveTodayPages = await archiveTodayArchive.getSnapshots('example.com')
console.log('\n--- Archive.today ---')
console.log(`Znaleziono ${archiveTodayPages.pages.length} stron:`)
console.log(JSON.stringify(archiveTodayPages.pages.slice(0, 2), undefined, 2))