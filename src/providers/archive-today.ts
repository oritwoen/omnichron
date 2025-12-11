import { $fetch } from 'ofetch'
import { cleanDoubleSlashes } from 'ufo'
import { consola } from 'consola'
import type { ArchiveOptions, ArchiveProvider, ArchiveResponse, ArchivedPage, ArchiveTodayMetadata } from '../types'
import { createSuccessResponse, createErrorResponse, mergeOptions, normalizeDomain } from '../utils'

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
    async snapshots(domain: string, reqOptions: ArchiveOptions = {}): Promise<ArchiveResponse> {
      // Merge options, preferring request options over init options
      const _options = mergeOptions(initOptions, reqOptions)
      
      // Use default values
      const baseURL = 'https://archive.is'
      const _snapshotUrl = 'https://archive.is'
      
      // Clean domain by removing protocol
      const cleanDomain = normalizeDomain(domain, false)
      
      try {
        // Using Memento API to get timemap directly with the domain
        // Format: https://archive.is/timemap/http://example.com
        const fullUrl = cleanDomain.includes('://') ? cleanDomain : `http://${cleanDomain}`
        const timemapUrl = `/timemap/${fullUrl}`
        
        const timemapResponse = await $fetch(timemapUrl, {
          baseURL,
          retry: 5,
          timeout: 60000,
          responseType: 'text',
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
              let cleanedUrl = cleanDoubleSlashes(origUrl.includes('://') ? origUrl : `https://${origUrl}`)
              
              // Remove trailing slash for test compatibility
              cleanedUrl = cleanedUrl.endsWith('/') ? cleanedUrl.slice(0, -1) : cleanedUrl
              
              // Clean snapshot URL as well
              let cleanedSnapshotUrl = snapshotUrl
              cleanedSnapshotUrl = cleanedSnapshotUrl.endsWith('/') ? cleanedSnapshotUrl.slice(0, -1) : cleanedSnapshotUrl
              
              pages.push({
                url: cleanedUrl,
                timestamp: isoTimestamp,
                snapshot: cleanedSnapshotUrl,
                _meta: {
                  hash: timestamp,        // Timestamp from URL
                  raw_date: datetime,     // Original date format
                  position: index         // Position in results list
                } as ArchiveTodayMetadata
              })
              
              index++
            } catch (error) {
              consola.error('Error parsing archive.today snapshot:', error)
            }
          }
        }
        
        // Return response
        return createSuccessResponse(pages, 'archive-today', {
          domain: cleanDomain,
          page: 1,
          empty: pages.length === 0
        })
      } catch (error) {
        return createErrorResponse(error, 'archive-today', {
          domain: cleanDomain
        })
      }
    }
  }
}
