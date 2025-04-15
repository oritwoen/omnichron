import { ofetch, FetchOptions } from 'ofetch'
import { hasProtocol, withTrailingSlash, withoutProtocol, cleanDoubleSlashes } from 'ufo'
import type { ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import type { CommonCrawlOptions } from '../_providers'
import { waybackTimestampToISO } from '../utils'

export function createCommonCrawl(initOptions: Partial<CommonCrawlOptions> = {}): ArchiveProvider {
  return {
    name: 'Common Crawl',
    
    async getSnapshots(domain: string, reqOptions: Partial<CommonCrawlOptions> = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const options = { ...initOptions, ...reqOptions }
      
      // Use default values
      const baseUrl = 'https://index.commoncrawl.org'
      const snapshotUrl = 'https://data.commoncrawl.org'
      const collection = options.collection || 'CC-MAIN-latest'
      
      // Normalize domain input using ufo
      const normalizedDomain = hasProtocol(domain) 
        ? withoutProtocol(domain) 
        : domain
      
      // Create URL pattern for search
      const urlPattern = domain.includes('*') 
        ? normalizedDomain 
        : withTrailingSlash(normalizedDomain) + '*'
      
      // Prepare fetch options using ofetch's rich options
      const fetchOptions: FetchOptions = {
        method: 'GET',
        baseURL: baseUrl,
        params: {
          url: urlPattern,
          output: 'json',
          fl: 'url,timestamp,status,digest',
          collapse: 'digest',
          limit: options?.limit ? String(options.limit) : '1000'
        },
        retry: 2,
        timeout: 60_000 // CommonCrawl may need a longer timeout
      }
      
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
        
        // Brak wyników lub nieprawidłowa odpowiedź
        if (!response.lines || !Array.isArray(response.lines) || response.lines.length === 0) {
          return {
            success: true,
            pages: [],
            _meta: {
              source: 'commoncrawl',
              collection,
              queryParams: fetchOptions.params
            }
          }
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
          const isoTimestamp = waybackTimestampToISO(rowData.timestamp || '')
          
          // Clean the URL
          const cleanedUrl = cleanDoubleSlashes(rowData.url || '')
          
          // Create direct link to the snapshot
          // CommonCrawl uses WARC format, build a link based on available data
          // May need adjustments based on actual URL format
          const snapUrl = `${snapshotUrl}/warc/${collection}/${rowData.digest}`
          
          return {
            url: cleanedUrl,
            timestamp: isoTimestamp,
            snapshot: snapUrl,
            _meta: {
              timestamp: rowData.timestamp,
              status: Number.parseInt(rowData.status || '0', 10),
              digest: rowData.digest,
              mime: rowData.mime,
              length: rowData.length,
              collection
            }
          }
        })
        
        return {
          success: true,
          pages,
          _meta: {
            source: 'commoncrawl',
            collection,
            pageCount: response.pageCount,
            blocks_with_urls: response.blocks_with_urls,
            queryParams: fetchOptions.params
          }
        }
      } catch (error: any) {
        return {
          success: false,
          pages: [],
          error: error.message || String(error),
          _meta: {
            source: 'commoncrawl',
            collection,
            errorDetails: error
          }
        }
      }
    }
  }
}

export default createCommonCrawl