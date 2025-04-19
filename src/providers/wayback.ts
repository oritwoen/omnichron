import { ofetch } from 'ofetch'
import type { ArchiveOptions, ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import {
  normalizeDomain,
  createSuccessResponse,
  createErrorResponse,
  createFetchOptions,
  mergeOptions,
  mapCdxRows
} from '../utils'

export default function wayback(initOptions: ArchiveOptions = {}): ArchiveProvider {
  return {
    name: 'Internet Archive Wayback Machine',
    slug: 'wayback',
    
    async getSnapshots(domain: string, reqOptions: ArchiveOptions = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = mergeOptions(initOptions, reqOptions)
      
      // Use default values
      const baseUrl = 'https://web.archive.org'
      const snapshotUrl = 'https://web.archive.org/web'
      
      // Normalize domain and create URL pattern for search
      const urlPattern = normalizeDomain(domain)
      
      // Prepare fetch options using common utility
      const fetchOptions = createFetchOptions(baseUrl, {
        url: urlPattern,
        output: 'json',
        fl: 'original,timestamp,statuscode',
        collapse: 'timestamp:4', // Collapse by year to reduce results
        limit: options?.limit ? String(options.limit) : '1000', // Configurable limit
      })
      
      try {
        // Use ofetch with CDX Server API path
        // TypeScript type assertion for the response
        type WaybackResponse = [string[], ...string[][]]
        const response = await ofetch('/cdx/search/cdx', fetchOptions) as WaybackResponse
        
        // The response is an array where the first element is the header and the rest are data rows
        if (!Array.isArray(response) || response.length <= 1) {
          return createSuccessResponse([], 'wayback', { queryParams: fetchOptions.params })
        }

        const dataRows = response.slice(1)

        // Map CDX rows to ArchivedPage objects
        const pages: ArchivedPage[] = mapCdxRows(dataRows, snapshotUrl)
        
        return createSuccessResponse(pages, 'wayback', { queryParams: fetchOptions.params })
      } catch (error: any) {
        return createErrorResponse(error, 'wayback')
      }
    }
  }
}

