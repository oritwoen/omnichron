import { FetchOptions } from 'ofetch'
import { hasProtocol, withTrailingSlash, withoutProtocol, cleanDoubleSlashes } from 'ufo'
import type { ArchiveOptions, ArchiveResponse, ArchivedPage, WaybackMetadata, ResponseMetadata } from './types'

// Default performance configuration
export const defaultPerformanceConfig = {
  concurrency: 5,
  batchSize: 50,
  timeout: 30_000,
  retries: 2
}

// Enhanced fetch options that will be used in fetch options
export const enhancedFetchOptions = {
  retry: 2,
  retryDelay: 300,
  timeout: 30_000,
  headers: {
    'Accept': 'application/json'
  }
}

// Utility for parallel processing with concurrency control
export async function processInParallel<T, R>(
  items: T[],
  processFunction: (item: T) => Promise<R>,
  options: { concurrency?: number, batchSize?: number } = {}
): Promise<R[]> {
  const concurrency = options.concurrency ?? defaultPerformanceConfig.concurrency;
  const batchSize = options.batchSize ?? defaultPerformanceConfig.batchSize;
  
  // Process small datasets directly
  if (items.length <= concurrency) {
    return Promise.all(items.map((item) => processFunction(item)));
  }
  
  // Process larger datasets with concurrency control
  const results: R[] = [];
  
  // Process in batches for better memory management
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processBatch(batch, concurrency);
    results.push(...batchResults);
  }
  
  return results;
  
  // Helper function to process a batch with concurrency limit
  async function processBatch(batch: T[], limit: number): Promise<R[]> {
    const batchResults: R[] = [];
    const pendingPromises: Promise<void>[] = [];
    const queue = [...batch];
    
    // Initial filling of the queue
    while (pendingPromises.length < limit && queue.length > 0) {
      const item = queue.shift()!;
      const promise = processFunction(item)
        .then(result => { batchResults.push(result); })
        .catch(error => { console.error('Parallel processing error:', error); });
      
      pendingPromises.push(promise);
    }
    
    // Process remaining items as earlier ones complete
    while (queue.length > 0) {
      await Promise.race(pendingPromises);
      
      // Create a new array for still pending promises
      const stillPending: Promise<void>[] = [];
      
      // Add a new item to process
      const item = queue.shift()!;
      const promise = processFunction(item)
        .then(result => { batchResults.push(result); })
        .catch(error => { console.error('Parallel processing error:', error); });
      
      stillPending.push(promise);
      
      // Replace pendingPromises with the new array
      pendingPromises.length = 0;
      pendingPromises.push(...stillPending);
    }
    
    // Wait for remaining promises
    await Promise.all(pendingPromises);
    
    return batchResults;
  }
}


/**
 * Converts a Wayback Machine timestamp to ISO8601 format
 * @param timestamp Wayback timestamp (YYYYMMDDhhmmss)
 * @returns ISO8601 formatted timestamp
 */
export function waybackTimestampToISO(timestamp: string): string {
  return timestamp.length >= 14 
    ? `${timestamp.slice(0,4)}-${timestamp.slice(4,6)}-${timestamp.slice(6,8)}T${timestamp.slice(8,10)}:${timestamp.slice(10,12)}:${timestamp.slice(12,14)}Z`
    : new Date().toISOString() // fallback to current date if format not recognized
}

/**
 * Normalizes a domain string for search queries
 * @param domain The domain or URL to normalize
 * @param appendWildcard Whether to append a wildcard for prefix matching
 * @returns Normalized domain string
 */
export function normalizeDomain(domain: string, appendWildcard = true): string {
  // Normalize domain input using ufo
  const normalizedDomain = hasProtocol(domain) 
    ? withoutProtocol(domain) 
    : domain
  
  // Create URL pattern for search if requested
  if (domain.includes('*')) {
    return normalizedDomain
  }
  
  return appendWildcard 
    ? withTrailingSlash(normalizedDomain) + '*'
    : normalizedDomain
}

/**
 * Creates a standardized success response object
 * @param pages Array of archived pages
 * @param source Source identifier for the provider
 * @param metadata Additional metadata to include
 * @returns Standardized ArchiveResponse object
 */
export function createSuccessResponse(
  pages: ArchivedPage[], 
  source: string, 
  metadata: Record<string, unknown> = {}
): ArchiveResponse {
  return {
    success: true,
    pages,
    _meta: {
      source,
      provider: source,
      ...metadata
    } as ResponseMetadata
  }
}

/**
 * Creates a standardized error response object
 * @param error Error object or message
 * @param source Source identifier for the provider
 * @param metadata Additional metadata to include
 * @returns Standardized ArchiveResponse error object
 */
export function createErrorResponse(
  error: Error | string, 
  source: string, 
  metadata: Record<string, unknown> = {}
): ArchiveResponse {
  return {
    success: false,
    pages: [],
    error: typeof error === 'string' ? error : error.message ?? String(error),
    _meta: {
      source,
      provider: source,
      errorDetails: error,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      ...metadata
    } as ResponseMetadata
  }
}

/**
 * Creates common fetch options with standard defaults
 * @param baseURL Base URL for the API
 * @param params Query parameters
 * @param options Additional options
 * @returns FetchOptions object
 */
export function createFetchOptions(
  baseURL: string, 
  params: Record<string, any> = {}, 
  options: Partial<FetchOptions & ArchiveOptions> = {}
): FetchOptions {
  return {
    method: 'GET',
    baseURL,
    params,
    retry: options.retries ?? defaultPerformanceConfig.retries,
    timeout: options.timeout ?? defaultPerformanceConfig.timeout,
    retryDelay: 300, // Add delay between retries
    retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504], // Standard retry status codes
    onResponseError: ({ request, response, options }) => {
      console.error(`[fetch error] ${options.method} ${request} failed with status ${response.status}`);
    },
    ...options
  }
}

/**
 * Merges initial options with request options, preferring request options
 * @param initOptions Initial options provided during provider creation
 * @param reqOptions Request-specific options
 * @returns Merged options object
 */
export function mergeOptions<T extends ArchiveOptions>(
  initOptions: Partial<T> = {},
  reqOptions: Partial<T> = {}
): T {
  return { 
    ...defaultPerformanceConfig,
    ...initOptions, 
    ...reqOptions 
  } as T
}
/**
 * Maps CDX server API response rows to ArchivedPage objects.
 * @param dataRows Array of rows from CDX API, excluding header.
 * @param snapshotBaseUrl Base URL for snapshot (including path segment).
 * @param providerSlug Provider identifier used for metadata typing.
 * @param options Performance options for processing.
 * @returns Array of ArchivedPage objects.
 */
export function mapCdxRows(
  dataRows: string[][], 
  snapshotBaseUrl: string, 
  providerSlug = 'wayback',
  options: ArchiveOptions = {}
): ArchivedPage[] {
  // Get batch size from options or use default
  const batchSize = options.batchSize ?? defaultPerformanceConfig.batchSize;
  
  // For small datasets, process directly without batching
  if (dataRows.length <= batchSize) {
    return dataRows.map((row) => rowToArchivedPage(row));
  }
  
  // For larger datasets, process in batches for better memory usage
  const results: ArchivedPage[] = [];
  
  for (let i = 0; i < dataRows.length; i += batchSize) {
    const batch = dataRows.slice(i, i + batchSize);
    results.push(...batch.map((row) => rowToArchivedPage(row)));
  }
  
  return results;
  
  // Helper function to convert a row to an ArchivedPage
  function rowToArchivedPage([rawUrl, rawTimestamp, rawStatus]: string[]): ArchivedPage {
    const originalUrl = cleanDoubleSlashes(rawUrl ?? '')
    const timestampRaw = rawTimestamp ?? ''
    const isoTimestamp = waybackTimestampToISO(timestampRaw)
    const snapUrl = `${snapshotBaseUrl}/${timestampRaw}/${originalUrl}`
    return {
      url: originalUrl,
      timestamp: isoTimestamp,
      snapshot: snapUrl,
      _meta: {
        timestamp: timestampRaw,
        status: Number.parseInt(rawStatus ?? '0', 10),
        provider: providerSlug
      } as WaybackMetadata
    }
  }
}