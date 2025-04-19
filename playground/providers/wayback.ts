import { createArchive } from 'omnichron'
import wayback from 'omnichron/providers/wayback'

const archive = createArchive(
  wayback({
    limit: 10,
    timeout: 10
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
