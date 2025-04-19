import { createArchive } from 'omnichron'
import ukWebArchive from 'omnichron/providers/uk-web-archive'

try {
  const archive = createArchive(ukWebArchive())
  const result = await archive.getSnapshots('example.com', { limit: 10 })
  console.log('UK Web Archive found', result.pages.length, 'pages')
  for (const page of result.pages.slice(0, 5)) {
    console.log(page.url, page.timestamp, page.snapshot)
  }
} catch (error_) {
  console.error(error_)
}
