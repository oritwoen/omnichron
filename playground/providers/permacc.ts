import { createArchive, providers } from 'omnichron'

const archive = createArchive(
  await providers.permacc({
    apiKey: 'your-api-key-here',
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
