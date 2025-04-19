import { createArchive } from 'omnichron'
import archiveToday from 'omnichron/providers/archive-today'

const archive = createArchive(
  archiveToday()
)

const snapshots = await archive.getSnapshots('example.com')

console.log(snapshots)
