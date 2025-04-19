import { createArchive } from 'omnichron'
import wayback from 'omnichron/providers/wayback'
import archiveToday from 'omnichron/providers/archive-today'

try {
  // Wayback Machine
  const waybackArchive = createArchive(wayback())
  const waybackPages = await waybackArchive.getSnapshots('example.com', { limit: 5 })
  console.log('Wayback Machine:', waybackPages.pages.length, 'pages')
  console.log(waybackPages)

  // Archive.today
  const todayArchive = createArchive(archiveToday())
  const todayPages = await todayArchive.getSnapshots('example.com')
  console.log('Archive.today:', todayPages.pages.length, 'pages (showing up to 2)')
  console.log(todayPages.pages.slice(0, 2))
} catch (error_) {
  console.error(error_)
}