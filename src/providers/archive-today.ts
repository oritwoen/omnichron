import { ofetch } from 'ofetch'
import { cleanDoubleSlashes } from 'ufo'
import type { ArchiveOptions, ArchiveProvider, ArchiveResponse, ArchivedPage } from '../types'
import { createSuccessResponse, createErrorResponse, createFetchOptions, mergeOptions, normalizeDomain } from '../utils'

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const options = mergeOptions(initOptions, reqOptions)
      
      // Use default values
      const baseUrl = 'https://archive.ph'
      const snapshotUrl = 'https://archive.ph'
      
      // Clean domain by removing protocol
      const cleanDomain = normalizeDomain(domain, false)
      
      // Prepare fetch options using common utility
      const fetchOptions = createFetchOptions(baseUrl, {
        // Add cache buster to avoid cached results
        t: Date.now(),
      }, {
        retry: 3 // More retries for archive.today
      })
      
      try {
        // Get HTML response, using path format
        const html = await ofetch(`/${cleanDomain}`, fetchOptions) as string
        
        if (typeof html !== 'string') {
          throw new TypeError('Unexpected response format')
        }
        
        // Simple regex extraction of archive links
        // Archive.today links follow the pattern: /hash/url
        const linkRegex = /<a[^>]*href="\/([a-zA-Z0-9]+)\/(https?:\/\/[^"]+)"[^>]*>(.*?)<\/a>/g
        const dateRegex = /<td class="date">([^<]+)<\/td>/g
        
        const pages: ArchivedPage[] = []
        let linkMatch
        const dates: string[] = []
        
        // Extract all dates first
        let dateMatch
        while ((dateMatch = dateRegex.exec(html)) !== null) {
          dates.push(dateMatch[1])
        }
        
        // Extract all links
        let index = 0
        while ((linkMatch = linkRegex.exec(html)) !== null) {
          if (linkMatch[2].includes(cleanDomain)) {
            const rawDate = index < dates.length ? dates[index] : ''
            // Trying to parse archive.today's date format to ISO 8601
            // Date format is typically like "01 Jan 2022"
            let isoTimestamp = new Date().toISOString()  // Default to current date
            
            try {
              if (rawDate) {
                const parsedDate = new Date(rawDate)
                if (!Number.isNaN(parsedDate.getTime())) {
                  isoTimestamp = parsedDate.toISOString()
                }
              }
            } catch {
              // Fall back to current date if parsing fails
            }
            
            // Clean potential double slashes in URL
            const cleanedUrl = cleanDoubleSlashes(linkMatch[2])
            
            // Create direct URL to the archived version
            const snapUrl = `${snapshotUrl}/${linkMatch[1]}/${cleanedUrl}`
            
            pages.push({
              url: cleanedUrl,
              timestamp: isoTimestamp,
              snapshot: snapUrl,
              _meta: {
                hash: linkMatch[1],    // Hash from URL
                raw_date: rawDate,     // Original date format
                position: index        // Position in results list
              }
            })
            index++
          }
        }
        
        return createSuccessResponse(pages, 'archive-today', {
          domain: cleanDomain,
          page: 1
        })
      } catch (error: any) {
        return createErrorResponse(error, 'archive-today', {
          domain: cleanDomain
        })
      }
    }
  }
}

