import { createArchive } from 'omnichron'
import permacc from 'omnichron/providers/permacc'

const archive = createArchive(
  permacc({
    apiKey: 'your-api-key-here',
  })
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
