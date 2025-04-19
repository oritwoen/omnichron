import { createArchive } from 'omnichron'
import permacc from 'omnichron/providers/permacc'

const archive = createArchive(
  permacc({
    timeout: 5000 // 5 seconds timeout
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
