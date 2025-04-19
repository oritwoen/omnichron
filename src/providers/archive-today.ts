import { ofetch } from 'ofetch'
import { cleanDoubleSlashes } from 'ufo'
import type { ArchiveOptions, ArchiveProvider, ArchiveResponse, ArchivedPage, ArchiveTodayMetadata } from '../types'
import { createSuccessResponse, createErrorResponse, createFetchOptions, mergeOptions, normalizeDomain } from 'omnichron/utils'

/**
 * Create an Archive.today archive provider.
 *
 * @param initOptions - Initial options for Archive.today (e.g., maxRedirects, cache settings).
 * @returns ArchiveProvider instance for fetching snapshots from Archive.today.
 */
export default function archiveToday(initOptions: ArchiveOptions = {}): ArchiveProvider {
  return {
    name: 'Archive.today',
    slug: 'archive-today',
    
    /**
     * Fetch archived snapshots from Archive.today.
     *
     * @param domain - The domain to fetch archives for.
     * @param reqOptions - Request-specific options overriding initial settings.
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async getSnapshots(domain: string, reqOptions: ArchiveOptions = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const _options = mergeOptions(initOptions, reqOptions)
      
      // Use default values
      const baseUrl = 'https://archive.is'
      const _snapshotUrl = 'https://archive.is'
      
      // Clean domain by removing protocol
      const cleanDomain = normalizeDomain(domain, false)
      
      // Prepare fetch options using common utility but WITHOUT query parameters
      // Archive.today timemap API doesn't support query parameters
      const fetchOptions = await createFetchOptions(baseUrl, {}, {
        retry: 5,           // More retries for archive.today
        timeout: 60000,     // Extended timeout (60 seconds)
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': baseUrl
        }
      })
      
      try {
        // Using Memento API to get timemap directly with the domain
        // Format: https://archive.is/timemap/http://example.com
        const fullUrl = cleanDomain.includes('://') ? cleanDomain : `http://${cleanDomain}`
        const timemapUrl = `/timemap/${fullUrl}`
        
        const timemapResponse = await ofetch(timemapUrl, {
          ...fetchOptions,
          responseType: 'text',  // Explicitly request text response
          parseResponse: txt => txt  // Ensure we get raw text
        })
        
        // Parse the Memento API response
        // Format: <http://archive.md/20140101030405/https://example.com/>; rel="memento"; datetime="Wed, 01 Jan 2014 03:04:05 GMT"
        const pages: ArchivedPage[] = []
        const mementoRegex = /<(https?:\/\/archive\.(?:is|today|md|ph)\/([0-9]{8,14})\/(?:https?:\/\/)?([^>]+))>;\s*rel="(?:first\s+)?memento";\s*datetime="([^"]+)"/g
        
        let mementoMatch
        let index = 0
        
        while ((mementoMatch = mementoRegex.exec(timemapResponse)) !== null) {
          const [, snapshotUrl, timestamp, origUrl, datetime] = mementoMatch
          
          // Check if the URL belongs to our domain
          if (origUrl.includes(cleanDomain)) {
            try {
              // Parse the ISO timestamp
              const parsedDate = new Date(datetime)
              const isoTimestamp = Number.isNaN(parsedDate.getTime())
                ? new Date().toISOString()
                : parsedDate.toISOString()
              
              // Create cleaned URL
              const cleanedUrl = cleanDoubleSlashes(origUrl.includes('://') ? origUrl : `https://${origUrl}`)
              
              pages.push({
                url: cleanedUrl,
                timestamp: isoTimestamp,
                snapshot: snapshotUrl,
                _meta: {
                  hash: timestamp,        // Timestamp from URL
                  raw_date: datetime,     // Original date format
                  position: index         // Position in results list
                } as ArchiveTodayMetadata
              })
              
              index++
            } catch (error) {
              console.error('Error parsing archive.today snapshot:', error)
            }
          }
        }
        
        // Return response
        return createSuccessResponse(pages, 'archive-today', {
          domain: cleanDomain,
          page: 1,
          empty: pages.length === 0
        })
      } catch (error: any) {
        return createErrorResponse(error, 'archive-today', {
          domain: cleanDomain
        })
      }
    }
  }
}