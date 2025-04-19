import { defu } from 'defu'
import type { ArchiveOptions, ArchiveResponse, ArchiveProvider, ArchivedPage } from './types'
import { getStoredResponse, storeResponse } from './storage'
import { defaultPerformanceConfig, processInParallel } from './utils'

/**
 * Create a unified archive client that wraps one or multiple providers.
 *
 * @param providers - Single ArchiveProvider or array of providers to use
 * @param options - Default ArchiveOptions applied to each request (limit, cache, ttl, concurrency, etc.)
 * @returns An object with methods `getSnapshots` and `getPages` for fetching archive data
 */
export function createArchive(providers: ArchiveProvider | ArchiveProvider[], options?: ArchiveOptions) {
  // Convert single provider to array for consistent handling
  const providerArray = Array.isArray(providers) ? providers : [providers];
  return {
    /**
     * Fetch archived snapshots for a domain, returning a full response object.
     * @param domain The domain to query
     * @param listOptions Request-specific options (limit, cache, ttl, concurrency, batchSize)
     * @returns ArchiveResponse including pages, metadata, and cache info
     */
    async getSnapshots(domain: string, listOptions?: ArchiveOptions): Promise<ArchiveResponse> {
      const mergedOptions = defu(
        listOptions, 
        options, 
        { cache: true, ...defaultPerformanceConfig }
      )
      
      // When only one provider is used, handle as before
      if (providerArray.length === 1) {
        const provider = providerArray[0];
        
        // Check storage first if not explicitly disabled
        if (mergedOptions.cache !== false) {
          const storedResponse = await getStoredResponse(provider, domain, mergedOptions)
          if (storedResponse) {
            return storedResponse
          }
        }
        
        // Fetch fresh data
        const response = await provider.getSnapshots(domain, mergedOptions)
        
        // Store successful responses
        if (response.success && mergedOptions.cache !== false) {
          await storeResponse(provider, domain, response, mergedOptions)
        }
        
        return response
      }
      
      // For multiple providers, fetch in parallel with concurrency control
      const fetchProvider = async (provider: ArchiveProvider): Promise<ArchiveResponse> => {
        // Try storage first
        if (mergedOptions.cache !== false) {
          const storedResponse = await getStoredResponse(provider, domain, mergedOptions)
          if (storedResponse) {
            return storedResponse
          }
        }
        
        // Fetch fresh data
        try {
          const response = await provider.getSnapshots(domain, mergedOptions)
          
          // Store successful responses
          if (response.success && mergedOptions.cache !== false) {
            await storeResponse(provider, domain, response, mergedOptions)
          }
          
          return response
        } catch (error) {
          // Return error response if provider fails
          return {
            success: false,
            pages: [],
            error: error instanceof Error ? error.message : String(error),
            _meta: {
              source: provider.name,
              provider: provider.name,
              errorDetails: error
            }
          }
        }
      }
      
      // Process all providers in parallel with concurrency control
      const responses = await processInParallel(
        providerArray, 
        fetchProvider, 
        { 
          concurrency: mergedOptions.concurrency, 
          batchSize: mergedOptions.batchSize 
        }
      )
      
      // Combine successful results
      const allPages: ArchivedPage[] = []
      const errors: string[] = []
      let anySuccess = false
      
      for (const response of responses) {
        if (response.success) {
          anySuccess = true
          allPages.push(...response.pages)
        } else if (response.error) {
          errors.push(response.error)
        }
      }
      
      // Sort pages by timestamp (newest first)
      allPages.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      
      // Apply limit if specified
      const limitedPages = mergedOptions.limit ? allPages.slice(0, mergedOptions.limit) : allPages
      
      // Create combined response
      return {
        success: anySuccess,
        pages: limitedPages,
        error: anySuccess ? undefined : errors.join('; '),
        _meta: {
          source: 'multiple',
          provider: providerArray.map(p => p.name).join(','),
          providerCount: providerArray.length,
          errors: errors.length > 0 ? errors : undefined
        }
      }
    },
    /**
     * Fetch archived snapshots for a domain, returning only the pages array or throwing on error.
     * @param domain The domain to query
     * @param listOptions Request-specific options (limit, cache, ttl)
     * @throws Error if the underlying response indicates failure
     * @returns Array of ArchivedPage objects
     */
    async getPages(domain: string, listOptions?: ArchiveOptions): Promise<ArchivedPage[]> {
      const res = await this.getSnapshots(domain, listOptions)
      if (!res.success) {
        throw new Error(res.error ?? 'Failed to fetch archive snapshots')
      }
      return res.pages
    }
  }
}