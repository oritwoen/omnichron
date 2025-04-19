import { createArchive } from 'omnichron'
import mementoTime from 'omnichron/providers/memento-time'

const archive = createArchive(
  mementoTime({
    timeout: 5000 // 5 seconds timeout
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
