import { ofetch } from 'ofetch'
import { cleanDoubleSlashes } from 'ufo'
import type { ArchiveOptions, ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import { 
  waybackTimestampToISO, 
  normalizeDomain, 
  createSuccessResponse,
  createErrorResponse,
  createFetchOptions,
  mergeOptions 
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
        
        // The response is an array where the first element is the header
        // and the rest are the actual data rows
        if (!Array.isArray(response) || response.length <= 1) {
          return createSuccessResponse([], 'wayback', { queryParams: fetchOptions.params })
        }
        
        // Remove the header row
        const dataRows = response.slice(1)
        
        // Map the data to our ArchivedPage interface
        const pages: ArchivedPage[] = dataRows.map(row => {
          // Use helper function to convert timestamp
          const isoTimestamp = waybackTimestampToISO(row[1])
          
          // Clean potential double slashes in URL
          const cleanedUrl = cleanDoubleSlashes(row[0])
          
          // Create direct URL to the archived version
          const snapUrl = `${snapshotUrl}/${row[1]}/${cleanedUrl}`
            
          return {
            url: cleanedUrl, // cleaned URL
            timestamp: isoTimestamp,
            snapshot: snapUrl,
            _meta: {
              timestamp: row[1], // original timestamp
              status: Number.parseInt(row[2], 10) // HTTP status code
            }
          }
        })
        
        return createSuccessResponse(pages, 'wayback', { queryParams: fetchOptions.params })
      } catch (error: any) {
        return createErrorResponse(error, 'wayback')
      }
    }
  }
}

