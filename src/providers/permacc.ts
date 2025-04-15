import { ofetch, FetchOptions } from 'ofetch'
import { cleanDoubleSlashes } from 'ufo'
import type { ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import type { PermaccOptions } from '../_providers'

export function createPermacc(initOptions: Partial<PermaccOptions> = {}): ArchiveProvider {
  return {
    name: 'Perma.cc',
    
    async getSnapshots(domain: string, reqOptions: Partial<PermaccOptions> = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = { ...initOptions, ...reqOptions }
      
      // Ensure API key is provided
      if (!options.apiKey) {
        return {
          success: false,
          pages: [],
          error: 'API key is required for Perma.cc',
          _meta: {
            source: 'permacc'
          }
        }
      }
      
      // Use default values and required apiKey
      const baseUrl = 'https://api.perma.cc'
      const snapshotUrl = 'https://perma.cc'
      const { apiKey } = options
      
      // Clean domain for search
      const cleanDomain = domain.replace(/^https?:\/\//, '')
      
      // Prepare fetch options
      const fetchOptions: FetchOptions = {
        method: 'GET',
        baseURL: baseUrl,
        headers: {
          'Authorization': `ApiKey ${apiKey}`,
          'Content-Type': 'application/json'
        },
        retry: 2,
        timeout: 30_000,
        params: {
          // Perma.cc pagination and filtering
          limit: options?.limit || 100,
          url: cleanDomain // Search by URL
        }
      }
      
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
        const response = await ofetch('/v1/public/archives/', fetchOptions) as PermaccResponse
        
        if (!response.objects || response.objects.length === 0) {
          return {
            success: true,
            pages: [],
            _meta: {
              source: 'permacc',
              queryParams: fetchOptions.params
            }
          }
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
            const timestamp = item.creation_timestamp || new Date().toISOString()
            
            return {
              url: cleanedUrl,
              timestamp,
              snapshot: snapUrl,
              _meta: {
                guid: item.guid,
                title: item.title,
                status: item.status,
                created_by: item.created_by?.id
              }
            }
          })
        
        return {
          success: true,
          pages,
          _meta: {
            source: 'permacc',
            queryParams: fetchOptions.params,
            meta: response.meta || {}
          }
        }
      } catch (error: any) {
        return {
          success: false,
          pages: [],
          error: error.message || String(error),
          _meta: {
            source: 'permacc',
            errorDetails: error
          }
        }
      }
    }
  }
}

export default createPermacc