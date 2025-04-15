import type { ArchiveProvider } from '../types'
import wayback from './wayback'
import archive from './archive-today'
import ukWebArchive from './uk-web-archive'

// Pre-instantiated providers for easy access
export const providers: Record<string, ArchiveProvider> = {
  wayback: wayback(),
  archive: archive(),
  ukWebArchive: ukWebArchive()
}