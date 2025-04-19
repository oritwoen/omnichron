import { ofetch } from 'ofetch'
import { cleanDoubleSlashes } from 'ufo'
import type { ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import type { MementoTimeOptions } from '../_providers'
import { 
  normalizeDomain,
  createFetchOptions, 
  mergeOptions 
} from '../utils'

/**
 * Interface for Memento Time Travel API response
 */
interface MementoTimeResponse {
  mementos: {
    list: Array<{
      uri: string;
      datetime: string;
      archive?: string;
    }>;
  };
  original_uri: string;
  timemap_uri: {
    json_format: string;
  };
}

/**
 * Parse Memento datetime format to ISO 8601
 */
function parseMementiDateTime(datetime: string): string {
  try {
    // Memento typically uses RFC 1123 format
    const date = new Date(datetime);
    return date.toISOString();
  } catch {
    return new Date().toISOString(); // Fallback to current date if parsing fails
  }
}

/**
 * Create a Memento Time Travel archive provider.
 *
 * @param initOptions - Initial options for Memento Time Travel (e.g., limit, cache settings).
 * @returns ArchiveProvider instance for fetching snapshots from Memento Time Travel.
 */
export default function mementoTime(initOptions: MementoTimeOptions = {}): ArchiveProvider {
  return {
    name: 'Memento Time Travel',
    slug: 'memento-time',
    
    /**
     * Fetch archived snapshots from Memento Time Travel.
     *
     * @param domain - The domain to fetch archives for.
     * @param reqOptions - Request-specific options overriding initial settings.
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async getSnapshots(domain: string, reqOptions: MementoTimeOptions = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = await mergeOptions(initOptions, reqOptions)
      
      // Use default values
      const baseUrl = 'https://timetravel.mementoweb.org'
      
      // Normalize domain for query
      // Memento needs a full URL, so we'll ensure it has a protocol
      const normalizedUrl = normalizeDomain(domain, false)
      const url = normalizedUrl.startsWith('http') ? normalizedUrl : `https://${normalizedUrl}`
      
      // Prepare fetch options
      const fetchOptions = await createFetchOptions(baseUrl, {}, {
        timeout: options.timeout ?? 60000 // Longer timeout for aggregator service
      })
      
      try {
        // Fetch archived snapshots from Memento Time Travel
        const response = await ofetch(`/timemap/json/${url}`, fetchOptions) as MementoTimeResponse
        
        // Check for empty response
        if (!response.mementos || !response.mementos.list || response.mementos.list.length === 0) {
          return {
            success: true,
            pages: [],
            _meta: {
              source: 'memento-time',
              provider: 'memento-time',
              originalUrl: url,
              queryParams: fetchOptions.params
            }
          }
        }
        
        // Convert response to standardized format
        const pages: ArchivedPage[] = response.mementos.list
          .map((memento, index) => {
            // Parse timestamp
            const isoTimestamp = parseMementiDateTime(memento.datetime)
            
            // Clean URL
            const cleanedUrl = cleanDoubleSlashes(response.original_uri)
            
            return {
              url: cleanedUrl,
              timestamp: isoTimestamp,
              snapshot: memento.uri,
              _meta: {
                originalTimestamp: memento.datetime,
                source: memento.archive || 'unknown', // Archive source if available
                position: index,
                provider: 'memento-time'
              }
            }
          })
        
        // Apply limit if specified
        const limitedPages = options.limit ? pages.slice(0, options.limit) : pages
        
        return {
          success: true,
          pages: limitedPages,
          _meta: {
            source: 'memento-time',
            provider: 'memento-time',
            originalUrl: url,
            totalResults: response.mementos.list.length,
            queryParams: fetchOptions.params
          }
        }
      } catch (error: any) {
        return {
          success: false,
          pages: [],
          error: typeof error === 'string' ? error : error.message ?? String(error),
          _meta: {
            source: 'memento-time',
            provider: 'memento-time',
            originalUrl: url,
            errorDetails: error,
            errorName: error.name
          }
        }
      }
    }
  }
}