import { createArchive, providers } from 'omnichron'

const archive = createArchive(
  await providers.archiveToday()
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
