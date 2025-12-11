import { FetchOptions } from 'ofetch'
import { hasProtocol, withTrailingSlash, withoutProtocol, cleanDoubleSlashes } from 'ufo'
import { consola } from 'consola'
import type { ArchiveOptions, ArchiveResponse, ArchivedPage, WaybackMetadata, ResponseMetadata } from '../types'
import { getConfig } from '../config'

// Utility for parallel processing with concurrency control
export async function processInParallel<T, R>(
  items: T[],
  processFunction: (item: T) => Promise<R>,
  options: { concurrency?: number, batchSize?: number } = {}
): Promise<R[]> {
  const config = await getConfig()
  const concurrency = options.concurrency ?? config.performance.concurrency;
  const batchSize = options.batchSize ?? config.performance.batchSize;
  
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
    const executing: Set<Promise<void>> = new Set();

    for (const item of batch) {
      const promise = processFunction(item)
        .then(result => { batchResults.push(result); })
        .catch(error => { consola.error('Parallel processing error:', error); })
        .finally(() => { executing.delete(promise); });

      executing.add(promise);

      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);

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
 * @param error Error object, message, or unknown value
 * @param source Source identifier for the provider
 * @param metadata Additional metadata to include
 * @returns Standardized ArchiveResponse error object
 */
export function createErrorResponse(
  error: unknown,
  source: string,
  metadata: Record<string, unknown> = {}
): ArchiveResponse {
  let errorMessage: string
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else {
    errorMessage = String(error)
  }

  return {
    success: false,
    pages: [],
    error: errorMessage,
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
export async function createFetchOptions(
  baseURL: string, 
  params: Record<string, any> = {}, 
  options: Partial<FetchOptions & ArchiveOptions> = {}
): Promise<FetchOptions> {
  const config = await getConfig()
  
  return {
    method: 'GET',
    baseURL,
    params,
    retry: options.retries ?? config.performance.retries,
    timeout: options.timeout ?? config.performance.timeout,
    retryDelay: 300, // Add delay between retries
    retryStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504], // Standard retry status codes
    onResponseError: ({ request, response, options }) => {
      consola.error(`[fetch error] ${options.method} ${request} failed with status ${response.status}`);
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
export async function mergeOptions<T extends ArchiveOptions>(
  initOptions: Partial<T> = {},
  reqOptions: Partial<T> = {}
): Promise<T> {
  const config = await getConfig()
  const defaultOptions = {
    concurrency: config.performance.concurrency,
    batchSize: config.performance.batchSize,
    timeout: config.performance.timeout,
    retries: config.performance.retries,
    cache: config.storage.cache,
    ttl: config.storage.ttl
  }
  
  // Create merged options with all properties preserved
  return { 
    ...defaultOptions,
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
export async function mapCdxRows(
  dataRows: string[][], 
  snapshotBaseUrl: string, 
  providerSlug = 'wayback',
  options: ArchiveOptions = {}
): Promise<ArchivedPage[]> {
  const config = await getConfig()
  
  // Get batch size from options or use default
  const batchSize = options.batchSize ?? config.performance.batchSize;
  
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
