import { $fetch } from 'ofetch'
import type { ArchiveOptions, ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import {
  normalizeDomain,
  createSuccessResponse,
  createErrorResponse,
  createFetchOptions,
  mergeOptions,
  mapCdxRows
} from '../utils'

/**
 * Create a Wayback Machine archive provider.
 *
 * @param initOptions - Initial archive options (limit, cache, ttl) for Wayback queries.
 * @returns ArchiveProvider instance for fetching snapshots from the Wayback Machine.
 */
export default function wayback(initOptions: ArchiveOptions = {}): ArchiveProvider {
  return {
    name: 'Internet Archive Wayback Machine',
    slug: 'wayback',
    
    /**
     * Fetch archived snapshots from the Internet Archive Wayback Machine.
     *
     * @param domain - The domain to search for archived snapshots.
     * @param reqOptions - Request-specific options overriding initial settings.
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async snapshots(domain: string, reqOptions: ArchiveOptions = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = mergeOptions(initOptions, reqOptions)
      
      // Use default values
      const baseUrl = 'https://web.archive.org'
      const snapshotUrl = 'https://web.archive.org/web'
      
      // Normalize domain and create URL pattern for search
      const urlPattern = normalizeDomain(domain)
      
      // Prepare fetch options using common utility
      const fetchOptions = await createFetchOptions(baseUrl, {
        url: urlPattern,
        output: 'json',
        fl: 'original,timestamp,statuscode',
        collapse: 'timestamp:4', // Collapse by year to reduce results
        limit: String((await options)?.limit ?? 1000), // Configurable limit with nullish coalescing
      })
      
      try {
        // Use ofetch with CDX Server API path
        // TypeScript type assertion for the response
        type WaybackResponse = [string[], ...string[][]]
        const response = await $fetch('/cdx/search/cdx', fetchOptions) as WaybackResponse
        
        // The response is an array where the first element is the header and the rest are data rows
        if (!Array.isArray(response) || response.length <= 1) {
          return createSuccessResponse([], 'wayback', { queryParams: fetchOptions.params || {} })
        }

        const dataRows = response.slice(1)

        // Map CDX rows to ArchivedPage objects with typed metadata
        const pages: ArchivedPage[] = await mapCdxRows(dataRows, snapshotUrl, 'wayback', await options)
        
        return createSuccessResponse(pages, 'wayback', { queryParams: fetchOptions.params || {} })
      } catch (error: any) {
        return createErrorResponse(error, 'wayback')
      }
    }
  }
}
