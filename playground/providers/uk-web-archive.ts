import { createArchive } from 'omnichron'
import ukWebArchive from 'omnichron/providers/uk-web-archive'

const archive = createArchive(
  ukWebArchive({
    timeout: 5000 // 5 seconds timeout
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
