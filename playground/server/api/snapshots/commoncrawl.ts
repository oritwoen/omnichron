import { createArchive, providers } from 'omnichron'

const archive = createArchive(
  providers.commoncrawl({
    timeout: 60 * 10
  })
)

export default defineEventHandler(async () => {
  const snapshots = await archive.getSnapshots('example.com')

  return snapshots
})
