import { ofetch, FetchOptions } from 'ofetch'
import { hasProtocol, withTrailingSlash, withoutProtocol, cleanDoubleSlashes } from 'ufo'
import type { ArchiveOptions, ArchivePlatform, ArchiveResponse, ArchivedPage } from '../types'
import { waybackTimestampToISO } from '../utils'

export function createWayback(initOptions: ArchiveOptions = {}): ArchivePlatform {
  return {
    name: 'Internet Archive Wayback Machine',
    
    async getSnapshots(domain: string, reqOptions: ArchiveOptions = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = { ...initOptions, ...reqOptions }
      
      // Use default values
      const baseUrl = 'https://web.archive.org'
      const snapshotUrl = 'https://web.archive.org/web'
      
      // Normalize domain input using ufo
      const normalizedDomain = hasProtocol(domain) 
        ? withoutProtocol(domain) 
        : domain
      
      // Create URL pattern for search
      const urlPattern = domain.includes('*') 
        ? normalizedDomain 
        : withTrailingSlash(normalizedDomain) + '*'
      
      // Prepare fetch options using ofetch's rich options
      const fetchOptions: FetchOptions = {
        method: 'GET',
        baseURL: baseUrl,
        params: {
          url: urlPattern,
          output: 'json',
          fl: 'original,timestamp,statuscode',
          collapse: 'timestamp:4', // Collapse by year to reduce results
          limit: options?.limit ? String(options.limit) : '1000', // Configurable limit
        },
        retry: 2,
        timeout: 30_000
      }
      
      try {
        // Use ofetch with CDX Server API path
        // TypeScript type assertion for the response
        type WaybackResponse = [string[], ...string[][]]
        const response = await ofetch('/cdx/search/cdx', fetchOptions) as WaybackResponse
        
        // The response is an array where the first element is the header
        // and the rest are the actual data rows
        if (!Array.isArray(response) || response.length <= 1) {
          return {
            success: true,
            pages: [],
            _meta: {
              source: 'wayback',
              queryParams: fetchOptions.params
            }
          }
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
        
        return {
          success: true,
          pages,
          _meta: {
            source: 'wayback',
            queryParams: fetchOptions.params
          }
        }
      } catch (error: any) {
        return {
          success: false,
          pages: [],
          error: error.message || String(error),
          _meta: {
            source: 'wayback',
            errorDetails: error
          }
        }
      }
    }
  }
}

export default createWayback