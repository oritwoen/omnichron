import { createArchive, providers } from 'omnichron'

const archive = createArchive(
  await providers.commoncrawl({
    timeout: 5000 // 5 seconds timeout
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
