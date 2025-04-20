import { ofetch } from 'ofetch'
import type { ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import type { WebCiteOptions } from '../_providers'
import { 
  normalizeDomain, 
  createSuccessResponse, 
  createErrorResponse, 
  createFetchOptions, 
  mergeOptions 
} from 'omnichron/utils'

/**
 * Create a WebCite archive provider.
 * 
 * Note: WebCite is currently not accepting new archiving requests, but existing
 * archives remain accessible.
 *
 * @param initOptions - Initial archive options for WebCite queries.
 * @returns ArchiveProvider instance for fetching snapshots from WebCite.
 */
export default function webcite(initOptions: Partial<WebCiteOptions> = {}): ArchiveProvider {
  return {
    name: 'WebCite',
    slug: 'webcite',
    
    /**
     * Fetch archived snapshots from WebCite.
     *
     * @param domain - The domain to search for archived snapshots.
     * @param reqOptions - Request-specific options overriding initial settings.
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async getSnapshots(domain: string, reqOptions: Partial<WebCiteOptions> = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = await mergeOptions(initOptions, reqOptions)
      
      // Use default values
      const baseUrl = 'https://www.webcitation.org'
      
      // Normalize domain for search
      const cleanDomain = normalizeDomain(domain, false)
      
      // Prepare fetch options using common utility
      const fetchOptions = await createFetchOptions(baseUrl, {
        url: encodeURIComponent(cleanDomain) // Query parameter for retrieval - must be properly encoded
      }, {
        timeout: options.timeout ?? 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      })
      
      try {
        // WebCite currently does not accept new archiving requests
        // The query API path to access archived content
        const queryPath = '/query'
        
        try {
          // Try to access the specific archived URL directly
          const response = await ofetch(queryPath, fetchOptions)
          
          // WebCite is read-only now, only return what we can find for the specific URL
          // Format of snapshot URLs: https://www.webcitation.org/[ID]
          // If we get a successful response, extract the ID and create an ArchivedPage object
          
          // Extract response meta text to check if we found archived content or just the notice
          const isNotFound = typeof response === 'string' && 
                            response.includes('We are currently not accepting archiving requests')
          
          const pages: ArchivedPage[] = []
          
          // Only add an entry if we found real content (not the generic notice)
          if (!isNotFound && response) {
            // Since WebCite doesn't have a proper API, we're handling a simple case
            // The format is simplified to match what WebCite offers today
            
            // Create ArchivedPage with available data - timestamp is estimation as
            // WebCite doesn't explicitly provide it in API responses
            pages.push({
              url: cleanDomain,
              timestamp: new Date().toISOString(), // Placeholder timestamp
              snapshot: `${baseUrl}/query?url=${encodeURIComponent(cleanDomain)}`,
              _meta: {
                requestId: 'webcite-archive', // Generic ID since we can't extract it
                provider: 'webcite'
              }
            })
          }
          
          return createSuccessResponse(pages, 'webcite', { 
            domain: cleanDomain,
            empty: pages.length === 0,
            queryParams: fetchOptions.params,
            isAvailable: !isNotFound
          })
        } catch (fetchError: any) {
          // Handle fetch error specially to ensure correct error response
          return createErrorResponse(fetchError, 'webcite', { 
            domain: cleanDomain
          })
        }
      } catch (error: any) {
        // Handle any other unexpected errors
        return createErrorResponse(error, 'webcite', { 
          domain: cleanDomain
        })
      }
    }
  }
}