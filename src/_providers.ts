import type { ArchiveOptions } from './types'

export type ProviderName = 'wayback' | 'archive-today' | 'permacc' | 'commoncrawl' | 'uk-web-archive' | 'memento-time'

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

export type ProviderOptions = {
  'wayback': WaybackOptions
  'archive-today': ArchiveTodayOptions
  'permacc': PermaccOptions
  'commoncrawl': CommonCrawlOptions
}

// Provider map and modules - using paths from tsconfig.json
export const providers = Object.freeze({
  'wayback': 'archivepkg/providers/wayback',
  'archive-today': 'archivepkg/providers/archive-today',
  'permacc': 'archivepkg/providers/permacc',
  'commoncrawl': 'archivepkg/providers/commoncrawl'
})