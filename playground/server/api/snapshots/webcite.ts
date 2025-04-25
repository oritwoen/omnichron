import { createArchive, providers } from 'omnichron'

const archive = createArchive(
  providers.webcite({
    timeout: 60 * 10
  })
)

export default defineEventHandler(async () => {
  const snapshots = await archive.snapshots('example.com')

  return snapshots
})