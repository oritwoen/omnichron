import { createArchive } from 'omnichron'
import commoncrawl from 'omnichron/providers/commoncrawl'

const archive = createArchive(
  commoncrawl({
    timeout: 5000 // 5 seconds timeout
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
