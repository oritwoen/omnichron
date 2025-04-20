import { createArchive, providers } from 'omnichron'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const archive = createArchive(
    providers.permacc({
      apiKey: config.permacc.apiKey,
    })
  )

  const snapshots = await archive.getSnapshots('example.com')

  return snapshots
})
