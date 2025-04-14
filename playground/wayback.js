// @ts-check

import { createArchive, platforms } from 'omnichron'

// Prosty test pobierania danych z Wayback Machine
const waybackArchive = createArchive(platforms.wayback)
const pages = await waybackArchive.getSnapshots('example.com', { 
  limit: 10  // Limit wyników
})

console.log(`\nWayback Machine - znaleziono ${pages.pages.length} stron:`)

// Wyświetlanie standardowych pól
console.log('\n--- Standardowe dane ---')
for (const page of pages.pages) {
  console.log(`- ${page.url} (${new Date(page.timestamp).toLocaleDateString()})`)
  console.log(`  Snapshot: ${page.snapshot}`)
}

// Wyświetlanie danych specyficznych dla platformy
console.log('\n--- Metadane specyficzne dla platformy ---')
for (const page of pages.pages) {
  console.log(`- Status: ${page._meta.status}, Timestamp: ${page._meta.timestamp}`)
}

// Wyświetlanie metadanych odpowiedzi
console.log('\n--- Metadane odpowiedzi ---')
console.log(pages._meta)