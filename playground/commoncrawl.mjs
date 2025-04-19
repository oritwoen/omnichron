import { createArchive } from 'omnichron'
import commonCrawl from 'omnichron/providers/commoncrawl'

try {
  const archive = createArchive(
    commonCrawl({ collection: 'CC-MAIN-2023-50', limit: 50 })
  )
  const result = await archive.getSnapshots('example.com')
  console.log('Common Crawl found', result.pages.length, 'pages')
  for (const page of result.pages.slice(0, 5)) {
    console.log(page.url, page.timestamp, page.snapshot)
  }
} catch (error_) {
  console.error(error_)
}
