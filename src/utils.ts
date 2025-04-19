import { FetchOptions } from 'ofetch'
import { hasProtocol, withTrailingSlash, withoutProtocol, cleanDoubleSlashes } from 'ufo'
import type { ArchiveOptions, ArchiveResponse, ArchivedPage, ArchiveMetadata, WaybackMetadata, ResponseMetadata } from './types'

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
  options: Partial<FetchOptions> = {}
): FetchOptions {
  return {
    method: 'GET',
    baseURL,
    params,
    retry: 2,
    timeout: 30_000,
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
  return { ...initOptions, ...reqOptions } as T
}
/**
 * Maps CDX server API response rows to ArchivedPage objects.
 * @param dataRows Array of rows from CDX API, excluding header.
 * @param snapshotBaseUrl Base URL for snapshot (including path segment).
 * @returns Array of ArchivedPage objects.
 */
export function mapCdxRows(dataRows: string[][], snapshotBaseUrl: string): ArchivedPage[] {
  return dataRows.map(
    // Destructure raw fields: original URL, timestamp, status code
    ([rawUrl, rawTimestamp, rawStatus]) => {
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
          status: Number.parseInt(rawStatus ?? '0', 10)
        } as WaybackMetadata
      }
    }
  )
}