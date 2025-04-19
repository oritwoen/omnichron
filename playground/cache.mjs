import { createArchive, configureCache, clearCache } from 'omnichron'
import wayback from 'omnichron/providers/wayback'
import memoryDriver from 'unstorage/drivers/memory'

try {
  // In-memory cache setup
  configureCache({ driver: memoryDriver(), cache: true })
  const archive = createArchive(wayback())
  const domain = 'example.com'
  const opts = { limit: 3 }

  console.log('First fetch (API)')
  const first = await archive.getSnapshots(domain, opts)
  console.log('fromCache:', first.fromCache, 'pages:', first.pages.length)

  console.log('Second fetch (cache)')
  const second = await archive.getSnapshots(domain, opts)
  console.log('fromCache:', second.fromCache, 'pages:', second.pages.length)

  console.log('Clearing cache')
  await clearCache()

  console.log('Third fetch (after clear)')
  const third = await archive.getSnapshots(domain, opts)
  console.log('fromCache:', third.fromCache, 'pages:', third.pages.length)
} catch (error_) {
  console.error(error_)
}
