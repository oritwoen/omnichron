import { createArchive } from 'omnichron'
import permacc from 'omnichron/providers/permacc'

const API_KEY = 'YOUR_API_KEY'

try {
  if (API_KEY === 'YOUR_API_KEY') {
    console.warn('Please set your Perma.cc API key')
  } else {
    const archive = createArchive(
      permacc({ apiKey: API_KEY, limit: 5 })
    )
    const result = await archive.getSnapshots('example.com')
    console.log('Perma.cc found', result.pages.length, 'pages')
    for (const page of result.pages.slice(0, 5)) {
      console.log(page.url, page.timestamp, page.snapshot)
    }
  }
} catch (error_) {
  console.error(error_)
}
