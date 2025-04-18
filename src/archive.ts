import { defu } from 'defu'
import type { ArchiveOptions, ArchiveResponse, ArchiveProvider } from './types'
import { getCachedResponse, cacheResponse } from './cache'

export function createArchive(provider: ArchiveProvider, options?: ArchiveOptions) {
  return {
    async getSnapshots(domain: string, listOptions?: ArchiveOptions): Promise<ArchiveResponse> {
      const mergedOptions = defu(listOptions, options, { cache: true })
      
      // Check cache first if not explicitly disabled
      if (mergedOptions.cache !== false) {
        const cachedResponse = await getCachedResponse(provider.name, domain, mergedOptions)
        if (cachedResponse) {
          return cachedResponse
        }
      }
      
      // Fetch fresh data
      const response = await provider.getSnapshots(domain, mergedOptions)
      
      // Cache successful responses
      if (response.success && mergedOptions.cache !== false) {
        await cacheResponse(provider.name, domain, response, mergedOptions)
      }
      
      return response
    }
  }
}