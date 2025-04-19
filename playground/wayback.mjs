import { createArchive } from 'omnichron'
import wayback from 'omnichron/providers/wayback'

try {
  const archive = createArchive(wayback())
  const result = await archive.getSnapshots('example.com', { limit: 10 })
  console.log('Wayback Machine found', result.pages.length, 'pages')
  for (const page of result.pages.slice(0, 5)) {
    console.log(page.url, page.timestamp, page.snapshot)
  }
} catch (error_) {
  console.error(error_)
}