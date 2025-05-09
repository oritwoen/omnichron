import { $fetch } from 'ofetch'
import { cleanDoubleSlashes } from 'ufo'
import type { ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import type { PermaccOptions } from '../_providers'
import { createSuccessResponse, createErrorResponse, createFetchOptions, mergeOptions, normalizeDomain } from '../utils'

/**
 * Create a Perma.cc archive provider.
 *
 * @param initOptions - Initial Perma.cc options including required `apiKey` and cache settings.
 * @returns ArchiveProvider instance for fetching snapshots from Perma.cc.
 */
export default function permacc(initOptions: Partial<PermaccOptions> = {}): ArchiveProvider {
  return {
    name: 'Perma.cc',
    slug: 'permacc',
    
    /**
     * Fetch archived snapshots from Perma.cc.
     *
     * @param domain - The domain to fetch archives for.
     * @param reqOptions - Request-specific Perma.cc options (e.g., apiKey, limit).
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async getSnapshots(domain: string, reqOptions: Partial<PermaccOptions> = {}): Promise<ArchiveResponse> {

      // Merge options, preserving apiKey from initOptions if not provided in reqOptions
      const options = await mergeOptions<PermaccOptions>(
        initOptions,
        reqOptions
      )
      
      // Ensure API key is provided
      if (!options.apiKey) {
        throw new Error('API key is required for Perma.cc')
      }
      
      // Use default values and required apiKey
      const baseUrl = 'https://api.perma.cc'
      const snapshotUrl = 'https://perma.cc'
      const { apiKey } = options
      
      // Clean domain for search
      const cleanDomain = normalizeDomain(domain, false)
      
      // Prepare fetch options using common utility with specific headers for Perma.cc
      const fetchOptions = await createFetchOptions(baseUrl, {
        // Perma.cc pagination and filtering
        limit: options?.limit ?? 100,
        url: cleanDomain // Search by URL
      }, {
        headers: {
          'Authorization': `ApiKey ${apiKey}`
        }
      })
      
      try {
        // Fetch archives from Perma.cc API
        // Define TypeScript interface for type safety
        interface PermaccArchive {
          guid: string
          url: string
          title: string
          creation_timestamp: string
          status: string
          created_by: {
            id: string
          }
        }
        
        interface PermaccResponse {
          objects: PermaccArchive[]
          meta: {
            limit: number
            offset: number
            total_count: number
          }
        }
        
        // Type assertion instead of generic to avoid type conflicts
        const response = await $fetch('/v1/public/archives/', fetchOptions) as PermaccResponse
        
        if (!response.objects || response.objects.length === 0) {
          return createSuccessResponse([], 'permacc', { queryParams: fetchOptions.params })
        }
        
        // Map the data to our ArchivedPage interface
        const pages: ArchivedPage[] = response.objects
          .filter((item) => {
            // Only include archives that match our domain
            return item.url && item.url.includes(cleanDomain)
          })
          .map((item) => {
            // Clean URL
            const cleanedUrl = cleanDoubleSlashes(item.url)
            
            // Create direct link to archived version
            const snapUrl = `${snapshotUrl}/${item.guid}`
            
            // Parse timestamp to ISO format
            const timestamp = item.creation_timestamp ?? new Date().toISOString()
            
            // Create page with properly typed metadata
            const page: ArchivedPage = {
              url: cleanedUrl,
              timestamp,
              snapshot: snapUrl,
              _meta: {
                guid: item.guid,
                title: item.title,
                status: item.status,
                created_by: item.created_by?.id
              }
            };
            
            return page;
          })
        
        return createSuccessResponse(pages, 'permacc', {
          queryParams: fetchOptions.params,
          meta: response.meta ?? {}
        })
      } catch (error: any) {
        return createErrorResponse(error, 'permacc')
      }
    }
  }
}

