// @ts-check

import { createArchive, platforms } from 'omnichron'

// Prosty test pobierania danych z Archive.today
const archiveToday = createArchive(platforms.archive)
const pages = await archiveToday.getSnapshots('example.com')

console.log(`\nArchive.today - znaleziono ${pages.pages.length} stron:`)

// Wyświetlanie standardowych pól
console.log('\n--- Standardowe dane ---')
for (const page of pages.pages.slice(0, 5)) {
  console.log(`- ${page.url} (${new Date(page.timestamp).toLocaleDateString()})`)
  console.log(`  Snapshot: ${page.snapshot}`)
}

// Wyświetlanie danych specyficznych dla platformy
console.log('\n--- Metadane specyficzne dla platformy ---')
for (const page of pages.pages.slice(0, 5)) {
  console.log(`- Hash: ${page._meta.hash}, Raw date: ${page._meta.raw_date}`)
}

// Wyświetlanie metadanych odpowiedzi
console.log('\n--- Metadane odpowiedzi ---')
console.log(pages._meta)