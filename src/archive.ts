import { defu } from 'defu'
import type { ArchiveOptions, ArchiveResponse, ArchiveProvider, ArchivedPage } from './types'
import { getCachedResponse, cacheResponse } from './cache'

/**
 * Create a unified archive client that wraps a specific provider.
 *
 * @param provider - ArchiveProvider instance to use (e.g., Wayback, Archive.today).
 * @param options - Default ArchiveOptions (limit, cache, ttl) applied to each request.
 * @returns An object with methods `getSnapshots` and `getPages` for fetching archive data.
 */
export function createArchive(provider: ArchiveProvider, options?: ArchiveOptions) {
  return {
    /**
     * Fetch archived snapshots for a domain, returning a full response object.
     * @param domain The domain to query
     * @param listOptions Request-specific options (limit, cache, ttl)
     * @returns ArchiveResponse including pages, metadata, and cache info
     */
    async getSnapshots(domain: string, listOptions?: ArchiveOptions): Promise<ArchiveResponse> {
      const mergedOptions = defu(listOptions, options, { cache: true })
      
      // Check cache first if not explicitly disabled
      if (mergedOptions.cache !== false) {
        const cachedResponse = await getCachedResponse(provider, domain, mergedOptions)
        if (cachedResponse) {
          return cachedResponse
        }
      }
      
      // Fetch fresh data
      const response = await provider.getSnapshots(domain, mergedOptions)
      
      // Cache successful responses
      if (response.success && mergedOptions.cache !== false) {
        await cacheResponse(provider, domain, response, mergedOptions)
      }
      
      return response
    },
    /**
     * Fetch archived snapshots for a domain, returning only the pages array or throwing on error.
     * @param domain The domain to query
     * @param listOptions Request-specific options (limit, cache, ttl)
     * @throws Error if the underlying response indicates failure
     * @returns Array of ArchivedPage objects
     */
    async getPages(domain: string, listOptions?: ArchiveOptions): Promise<ArchivedPage[]> {
      const res = await this.getSnapshots(domain, listOptions)
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch archive snapshots')
      }
      return res.pages
    }
  }
}