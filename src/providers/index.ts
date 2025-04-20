import type { ArchiveOptions, ArchiveProvider } from '../types'
import type { 
  WaybackOptions, 
  ArchiveTodayOptions, 
  PermaccOptions, 
  CommonCrawlOptions, 
  WebCiteOptions 
} from '../_providers'

/**
 * Provider factory with lazy-loading for optimized tree-shaking.
 * Only loads the providers that are actually used.
 */
export const providers = {
  /**
   * Creates a Wayback Machine provider.
   * @param options - Configuration options for the Wayback Machine provider
   * @returns Promise resolving to the Wayback Machine provider
   * @example
   * ```js
   * const waybackProvider = await providers.wayback({ limit: 100 })
   * ```
   */
  async wayback(options?: WaybackOptions): Promise<ArchiveProvider> {
    const { default: create } = await import('./wayback')
    return create(options)
  },
  
  /**
   * Creates an Archive.today provider.
   * @param options - Configuration options for the Archive.today provider
   * @returns Promise resolving to the Archive.today provider
   * @example
   * ```js
   * const archiveTodayProvider = await providers.archiveToday({ maxRedirects: 5 })
   * ```
   */
  async archiveToday(options?: ArchiveTodayOptions): Promise<ArchiveProvider> {
    const { default: create } = await import('./archive-today')
    return create(options)
  },
  
  /**
   * Creates a Perma.cc provider.
   * @param options - Configuration options for the Perma.cc provider (requires apiKey)
   * @returns Promise resolving to the Perma.cc provider
   * @example
   * ```js
   * const permaccProvider = await providers.permacc({ apiKey: 'your-api-key' })
   * ```
   */
  async permacc(options?: PermaccOptions): Promise<ArchiveProvider> {
    const { default: create } = await import('./permacc')
    return create(options)
  },
  
  /**
   * Creates a Common Crawl provider.
   * @param options - Configuration options for the Common Crawl provider
   * @returns Promise resolving to the Common Crawl provider
   * @example
   * ```js
   * const commoncrawlProvider = await providers.commoncrawl({ collection: 'CC-MAIN-2023-50' })
   * ```
   */
  async commoncrawl(options?: CommonCrawlOptions): Promise<ArchiveProvider> {
    const { default: create } = await import('./commoncrawl')
    return create(options)
  },
  
  /**
   * Creates a WebCite provider.
   * @param options - Configuration options for the WebCite provider
   * @returns Promise resolving to the WebCite provider
   * @example
   * ```js
   * const webciteProvider = await providers.webcite({ timeout: 10000 })
   * ```
   */
  async webcite(options?: WebCiteOptions): Promise<ArchiveProvider> {
    const { default: create } = await import('./webcite')
    return create(options)
  },

  /**
   * Helper to initialize all commonly used providers at once.
   * Note: Perma.cc is excluded as it requires an API key.
   * @param options - Common configuration options for all providers
   * @returns Promise resolving to an array of all common providers
   * @example
   * ```js
   * const allProviders = await providers.all({ timeout: 15000 })
   * const archive = createArchive(allProviders)
   * ```
   */
  async all(options?: ArchiveOptions): Promise<ArchiveProvider[]> {
    return Promise.all([
      this.wayback(options),
      this.archiveToday(options),
      this.commoncrawl(options),
      this.webcite(options)
      // permacc excluded as it requires API key
    ])
  }
}

// Export provider types
export type * from '../_providers'