import { ofetch } from 'ofetch'
import type { ArchiveOptions, ArchiveProvider, ArchiveResponse, ArchivedPage, UkWebArchiveMetadata } from '../types'
import {
  normalizeDomain,
  createSuccessResponse,
  createErrorResponse,
  createFetchOptions,
  mergeOptions,
  mapCdxRows
} from '../utils'

/**
 * Create a UK Web Archive provider.
 *
 * @param initOptions - Initial UK Web Archive options (e.g., limit, cache settings).
 * @returns ArchiveProvider instance for fetching snapshots from UK Web Archive.
 */
export default function ukWebArchive(initOptions: ArchiveOptions = {}): ArchiveProvider {
  return {
    name: 'UK Web Archive',
    slug: 'uk-web-archive',
    
    /**
     * Fetch archived snapshots from the UK Web Archive.
     *
     * @param domain - The domain to fetch archives for.
     * @param reqOptions - Request-specific options overriding initial settings.
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async getSnapshots(domain: string, reqOptions: ArchiveOptions = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = mergeOptions(initOptions, reqOptions)
      
      // Use default values for UK Web Archive
      const baseUrl = 'https://www.webarchive.org.uk/wayback/archive'
      const snapshotUrl = 'https://www.webarchive.org.uk/wayback/archive/web'
      
      // Normalize domain and create URL pattern for search
      const urlPattern = normalizeDomain(domain)
      
      // Prepare fetch options using common utility
      const fetchOptions = createFetchOptions(baseUrl, {
        url: urlPattern,
        output: 'json',
        fl: 'original,timestamp,statuscode',
        limit: String(options?.limit ?? 1000), // Configurable limit with nullish coalescing
      })
      
      try {
        // Use ofetch with CDX Server API path
        // TypeScript type assertion for the response
        type UkWebArchiveResponse = [string[], ...string[][]]
        const response = await ofetch('/cdx/search/cdx', fetchOptions) as UkWebArchiveResponse
        
        // The response is an array where the first element is the header and the rest are data rows
        if (!Array.isArray(response) || response.length <= 1) {
          return createSuccessResponse([], 'uk-web-archive', { queryParams: fetchOptions.params })
        }

        const dataRows = response.slice(1)

        // Map CDX rows to ArchivedPage objects with typed metadata
        const pages: ArchivedPage[] = mapCdxRows(dataRows, snapshotUrl)
        
        return createSuccessResponse(pages, 'uk-web-archive', { queryParams: fetchOptions.params })
      } catch (error: any) {
        return createErrorResponse(error, 'uk-web-archive')
      }
    }
  }
}

