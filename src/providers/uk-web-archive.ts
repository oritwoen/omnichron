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

export function createUkWebArchive(initOptions: ArchiveOptions = {}): ArchiveProvider {
  return {
    name: 'UK Web Archive',
    
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
        limit: options?.limit ? String(options.limit) : '1000', // Configurable limit
      })
      
      try {
        // Use ofetch with CDX Server API path
        // TypeScript type assertion for the response
        type UkWebArchiveResponse = [string[], ...string[][]]
        const response = await ofetch('/cdx/search/cdx', fetchOptions) as UkWebArchiveResponse
        
        // The response is an array where the first element is the header
        // and the rest are the actual data rows
        if (!Array.isArray(response) || response.length <= 1) {
          return createSuccessResponse([], 'uk-web-archive', { queryParams: fetchOptions.params })
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
        
        return createSuccessResponse(pages, 'uk-web-archive', { queryParams: fetchOptions.params })
      } catch (error: any) {
        return createErrorResponse(error, 'uk-web-archive')
      }
    }
  }
}

export default createUkWebArchive