// Import necessary dependencies
import type { ArchiveOptions, ArchiveResponse, ArchiveProvider, ArchivedPage, ArchiveInterface } from './types'
import { getStoredResponse, storeResponse } from './storage'
import { mergeOptions, processInParallel } from './utils'

/**
 * Create a unified archive client that wraps one or multiple providers.
 * Supports lazy loading and asynchronous provider initialization.
 *
 * @param providers - Single provider, array of providers, or Promise(s) resolving to provider(s)
 * @param options - Default options applied to all queries (limit, cache, ttl, concurrency, etc.)
 * @returns Archive client with methods for fetching and managing archive data
 * 
 * @example
 * ```js
 * // Single provider
 * const waybackArchive = createArchive(providers.wayback())
 * 
 * // Multiple providers
 * const multiArchive = createArchive([
 *   providers.wayback(),
 *   providers.archiveToday()
 * ])
 * 
 * // With options
 * const archive = createArchive(providers.all(), {
 *   limit: 10,
 *   cache: true,
 *   ttl: 3600000, // 1 hour cache TTL
 *   concurrency: 3
 * })
 * ```
 */
export function createArchive(
  providers: ArchiveProvider | ArchiveProvider[] | Promise<ArchiveProvider> | Promise<ArchiveProvider[]>, 
  options?: ArchiveOptions
) {
  // Storage for resolved providers
  let resolvedProviders: ArchiveProvider[] | undefined = undefined;
  
  /**
   * Resolves and caches the provider promises.
   * Ensures providers are only resolved once and then cached for future use.
   * 
   * @returns Promise resolving to array of all initialized providers
   * @internal
   */
  async function getProviders(): Promise<ArchiveProvider[]> {
    if (resolvedProviders) {
      return resolvedProviders;
    }
    
    const result = await Promise.resolve(providers);
    
    resolvedProviders = Array.isArray(result) ? result : [result];
    
    return resolvedProviders;
  }
  
  /**
   * Fetches data from a single provider with built-in caching.
   * Attempts to read from cache first, then falls back to fresh data.
   * 
   * @param provider - The archive provider to query
   * @param domain - The domain to search for archives
   * @param requestOptions - Options for this specific request
   * @returns Promise resolving to provider's response or error response
   * @internal
   */
  async function fetchFromProvider(
    provider: ArchiveProvider, 
    domain: string, 
    requestOptions: ArchiveOptions
  ): Promise<ArchiveResponse> {
    // Try cache first
    if (requestOptions.cache !== false) {
      const cached = await getStoredResponse(provider, domain, requestOptions);
      if (cached) return cached;
    }
    
    try {
      // Fetch fresh data
      const response = await provider.getSnapshots(domain, requestOptions);
      
      // Cache successful responses
      if (response.success && requestOptions.cache !== false) {
        await storeResponse(provider, domain, response, requestOptions);
      }
      
      return response;
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
      };
    }
  }
  
  /**
   * Combines results from multiple providers into a single response.
   * Merges pages, handles errors, applies sorting and pagination.
   * 
   * @param responses - Array of responses from different providers
   * @param limit - Optional limit on number of pages to return
   * @returns Combined archive response with merged pages and metadata
   * @internal
   */
  function combineResults(responses: ArchiveResponse[], limit?: number): ArchiveResponse {
    const allPages: ArchivedPage[] = [];
    const errors: string[] = [];
    let anySuccess = false;
    
    // Extract pages and errors
    for (const response of responses) {
      if (response.success) {
        anySuccess = true;
        allPages.push(...response.pages);
      } else if (response.error) {
        errors.push(response.error);
      }
    }
    
    // Sort pages by timestamp (newest first)
    allPages.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Apply limit if specified
    const limitedPages = limit ? allPages.slice(0, limit) : allPages;
    
    // Providers list for metadata
    const providersList = responses.map(r => 
      r._meta?.provider || 'unknown'
    ).filter(Boolean);
    
    // Create combined response
    return {
      success: anySuccess,
      pages: limitedPages,
      error: anySuccess ? undefined : errors.join('; '),
      _meta: {
        source: 'multiple',
        provider: providersList.join(','),
        providerCount: providersList.length,
        errors: errors.length > 0 ? errors : undefined
      }
    };
  }
  
  // Create the archive instance
  const archive = {
    // Store options for external access
    options,
    
    /**
     * Fetch archived snapshots for a domain.
     * Returns a full response object with pages, metadata, and cache status.
     * 
     * @param domain - The domain to search for in archive services (e.g., "example.com")
     * @param listOptions - Request-specific options that override the default options
     * @returns Promise resolving to ArchiveResponse with pages, metadata and status
     * 
     * @example
     * ```js
     * // Basic usage
     * const response = await archive.getSnapshots('example.com')
     * 
     * // With request-specific options
     * const response = await archive.getSnapshots('example.com', { 
     *   limit: 5,
     *   cache: false // Skip cache for this request
     * })
     * ```
     */
    async getSnapshots(domain: string, listOptions?: ArchiveOptions): Promise<ArchiveResponse> {
      const mergedOptions = await mergeOptions(options, listOptions);
      const providerArray = await getProviders();
      
      // For a single provider, use direct approach
      if (providerArray.length === 1) {
        return fetchFromProvider(providerArray[0], domain, mergedOptions);
      }
      
      // For multiple providers, fetch in parallel with concurrency control
      const responses = await processInParallel(
        providerArray,
        provider => fetchFromProvider(provider, domain, mergedOptions),
        { 
          concurrency: mergedOptions.concurrency, 
          batchSize: mergedOptions.batchSize 
        }
      );
      
      return combineResults(responses, mergedOptions.limit);
    },
    
    /**
     * Fetch archived pages for a domain, returning only the pages array.
     * Throws an error if the request fails (unlike getSnapshots which returns a success flag).
     * 
     * @param domain - The domain to search for in archive services
     * @param listOptions - Request-specific options that override the defaults
     * @returns Promise resolving to array of ArchivedPage objects
     * @throws Error if the request fails
     * 
     * @example
     * ```js
     * try {
     *   // Get pages directly
     *   const pages = await archive.getPages('example.com', { limit: 10 })
     *   
     *   // Work with pages array
     *   pages.forEach(page => console.log(page.snapshot))
     * } catch (error) {
     *   console.error('Failed to fetch pages:', error.message)
     * }
     * ```
     */
    async getPages(domain: string, listOptions?: ArchiveOptions): Promise<ArchivedPage[]> {
      const res = await this.getSnapshots(domain, listOptions);
      if (!res.success) {
        throw new Error(res.error ?? 'Failed to fetch archive snapshots');
      }
      return res.pages;
    },
    
    /**
     * Add a new provider to this archive instance.
     * Allows for dynamically extending the archive with additional providers.
     * 
     * @param provider - The provider or Promise resolving to a provider to add
     * @returns The archive instance for method chaining
     * 
     * @example
     * ```js
     * // Create archive with one provider
     * const archive = createArchive(providers.wayback())
     * 
     * // Add another provider later
     * await archive.use(providers.archiveToday())
     * 
     * // Chain calls
     * await archive
     *   .use(providers.webcite())
     *   .use(providers.commoncrawl())
     * ```
     */
    async use(provider: ArchiveProvider | Promise<ArchiveProvider>): Promise<typeof archive> {
      const resolvedProvider = await Promise.resolve(provider);
      const currentProviders = await getProviders();
      
      // Reset cached providers with the new list
      resolvedProviders = [...currentProviders, resolvedProvider];
      
      return this;
    },
    
    /**
     * Add multiple providers to this archive instance at once.
     * More efficient than calling use() multiple times.
     * 
     * @param newProviders - Array of providers or Promises resolving to providers
     * @returns The archive instance for method chaining
     * 
     * @example
     * ```js
     * // Create archive with one provider
     * const archive = createArchive(providers.wayback())
     * 
     * // Add multiple providers at once
     * await archive.useAll([
     *   providers.archiveToday(),
     *   providers.webcite(),
     *   providers.commoncrawl()
     * ])
     * ```
     */
    async useAll(newProviders: (ArchiveProvider | Promise<ArchiveProvider>)[]): Promise<typeof archive> {
      const resolvedNewProviders = await Promise.all(
        newProviders.map(p => Promise.resolve(p))
      );
      
      const currentProviders = await getProviders();
      
      // Reset cached providers with the new list
      resolvedProviders = [...currentProviders, ...resolvedNewProviders];
      
      return this;
    }
  };
  
  return archive;
}