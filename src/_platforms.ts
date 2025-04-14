import type { ArchiveOptions } from './types'

export type PlatformName = 'wayback' | 'archive-today' | 'permacc' | 'commoncrawl'

export interface WaybackOptions extends ArchiveOptions {
  collapse?: string
  filter?: string
}

export interface ArchiveTodayOptions extends ArchiveOptions {
  maxRedirects?: number
}

export interface PermaccOptions extends ArchiveOptions {
  apiKey: string // API key is required for Perma.cc
}

export interface CommonCrawlOptions extends ArchiveOptions {
  collection?: string // Identifier of the crawl collection (e.g. 'CC-MAIN-2023-50' or 'CC-MAIN-latest')
}

export type PlatformOptions = {
  'wayback': WaybackOptions
  'archive-today': ArchiveTodayOptions
  'permacc': PermaccOptions
  'commoncrawl': CommonCrawlOptions
}

// Platform map and modules - using paths from tsconfig.json
export const platforms = Object.freeze({
  'wayback': 'archivepkg/platforms/wayback',
  'archive-today': 'archivepkg/platforms/archive-today',
  'permacc': 'archivepkg/platforms/permacc',
  'commoncrawl': 'archivepkg/platforms/commoncrawl'
})