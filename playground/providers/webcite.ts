import { createArchive, providers } from 'omnichron'

const archive = createArchive(
  await providers.webcite({
    timeout: 30000
  })
)

// Try accessing an archive for example.com
const snapshots = await archive.getSnapshots('example.com')

console.log('WebCite response:', JSON.stringify(snapshots, undefined, 2))

// You can also try other domains that might have been archived in WebCite
// const moreSamples = await archive.getSnapshots('github.com')
// console.log('WebCite result for github.com:', JSON.stringify(moreSamples, undefined, 2))
