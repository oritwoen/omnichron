import { createArchive, providers } from 'omnichron'

const archive = createArchive(
  await providers.wayback({
    limit: 10,
    timeout: 10
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
