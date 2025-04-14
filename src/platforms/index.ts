import type { ArchivePlatform } from '../types'
import wayback from './wayback'
import archive from './archive-today'

// Pre-instantiated platforms for easy access
export const platforms: Record<string, ArchivePlatform> = {
  wayback: wayback(),
  archive: archive()
}