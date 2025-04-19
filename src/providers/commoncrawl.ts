import { ofetch } from 'ofetch'
import { cleanDoubleSlashes } from 'ufo'
import type { ArchiveProvider, ArchiveResponse, ArchivedPage, CommonCrawlMetadata } from '../types'
import type { CommonCrawlOptions } from '../_providers'
import { 
  waybackTimestampToISO, 
  normalizeDomain, 
  createSuccessResponse, 
  createErrorResponse, 
  createFetchOptions, 
  mergeOptions 
} from '../utils'

/**
 * Create a Common Crawl archive provider.
 *
 * @param initOptions - Initial Common Crawl options (e.g., collection, limit, cache settings).
 * @returns ArchiveProvider instance for fetching snapshots from Common Crawl.
 */
export default function commonCrawl(initOptions: Partial<CommonCrawlOptions> = {}): ArchiveProvider {
  return {
    name: 'Common Crawl',
    slug: 'commoncrawl',
    
    /**
     * Fetch archived snapshots from Common Crawl.
     *
     * @param domain - The domain to fetch archives for.
     * @param reqOptions - Request-specific Common Crawl options (e.g., collection, limit).
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async getSnapshots(domain: string, reqOptions: Partial<CommonCrawlOptions> = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = mergeOptions(initOptions, reqOptions)
      
      // Use default values
      const baseUrl = 'https://index.commoncrawl.org'
      const snapshotUrl = 'https://data.commoncrawl.org'
      const collection = options.collection ?? 'CC-MAIN-latest'
      
      // Normalize domain and create URL pattern for search
      const urlPattern = normalizeDomain(domain)
      
      // Prepare fetch options using common utility
      const fetchOptions = createFetchOptions(baseUrl, {
        url: urlPattern,
        output: 'json',
        fl: 'url,timestamp,status,digest',
        collapse: 'digest',
        limit: String(options?.limit ?? 1000)
      }, {
        timeout: 60_000 // CommonCrawl may need a longer timeout
      })
      
      try {
        // Use ofetch with CDX Server API path
        // TypeScript type assertion for the response
        type CCResponse = {
          lines?: string[][],
          blocks?: any[],
          pageCount?: number,
          blocks_with_urls?: number
        }
        const response = await ofetch(`/${collection}/cdx`, fetchOptions) as CCResponse
        
        // No results or invalid response
        if (!response.lines || !Array.isArray(response.lines) || response.lines.length === 0) {
          return createSuccessResponse([], 'commoncrawl', {
            collection,
            queryParams: fetchOptions.params
          })
        }
        
        // Extract fields and data rows
        const fields = ['urlkey', 'timestamp', 'url', 'mime', 'status', 'digest', 'length']
        const dataRows = response.lines
        
        // Map the data to our ArchivedPage interface
        const pages: ArchivedPage[] = dataRows.map(row => {
          // Create an object mapping fields to values
          const rowData: Record<string, string> = {}
          
          // Use entries() to get index and value in for-of loop
          for (const [index, field] of fields.entries()) {
            rowData[field] = row[index] || ''
          }
          
          // Convert timestamp to ISO format
          const isoTimestamp = waybackTimestampToISO(rowData.timestamp ?? '')
          
          // Clean the URL
          const cleanedUrl = cleanDoubleSlashes(rowData.url ?? '')
          
          // Create direct link to the snapshot
          // CommonCrawl uses WARC format, build a link based on available data
          const snapUrl = `${snapshotUrl}/warc/${collection}/${rowData.digest}`
          
          return {
            url: cleanedUrl,
            timestamp: isoTimestamp,
            snapshot: snapUrl,
            _meta: {
              timestamp: rowData.timestamp,
              status: Number.parseInt(rowData.status ?? '0', 10),
              digest: rowData.digest,
              mime: rowData.mime,
              length: rowData.length,
              collection
            } as CommonCrawlMetadata
          }
        })
        
        return createSuccessResponse(pages, 'commoncrawl', {
          collection,
          pageCount: response.pageCount,
          blocks_with_urls: response.blocks_with_urls,
          queryParams: fetchOptions.params
        })
      } catch (error: any) {
        return createErrorResponse(error, 'commoncrawl', { collection })
      }
    }
  }
}

