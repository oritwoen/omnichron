import { $fetch } from 'ofetch'
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
    async snapshots(domain: string, reqOptions: Partial<CommonCrawlOptions> = {}): Promise<ArchiveResponse> {
      const options = await mergeOptions(initOptions, reqOptions)

      const baseURL = 'https://index.commoncrawl.org'
      const dataBaseURL = 'https://data.commoncrawl.org'
      // Determine collection and CDX index path: use explicit or fetch latest via collinfo.json
      let collectionName = options.collection as string | undefined
      let indexName: string
      if (!collectionName || collectionName === 'CC-MAIN-latest') {
        let apiPath: string | undefined
        try {
          const collinfoOpts = await createFetchOptions(baseURL, {}, { timeout: options.timeout ?? 60_000 })
          const collinfo = await $fetch('/collinfo.json', collinfoOpts) as Array<any>
          if (Array.isArray(collinfo) && collinfo.length > 0) {
            const first = collinfo[0]
            const cdxApiProp = first['cdx-api'] || first.cdxApi
            if (typeof cdxApiProp === 'string') {
              // Extract path from URL or use as-is
              let raw = cdxApiProp.startsWith('http')
                ? new URL(cdxApiProp).pathname
                : cdxApiProp
              raw = raw.startsWith('/') ? raw.slice(1) : raw
              apiPath = raw
              // Derive collection name without '-index'
              collectionName = raw.endsWith('-index')
                ? raw.slice(0, -'-index'.length)
                : raw
            } else if (typeof first.name === 'string') {
              collectionName = first.name
              apiPath = collectionName.endsWith('-index')
                ? collectionName
                : `${collectionName}-index`
            }
          }
        } catch {
          // ignore and fallback
        }
        // Fallback defaults if collinfo failed or missing
        if (!collectionName) collectionName = 'CC-MAIN-latest'
        if (!apiPath) {
          apiPath = collectionName.endsWith('-index')
            ? collectionName
            : `${collectionName}-index`
        }
        indexName = apiPath
      } else {
        // Explicit collection provided by user
        indexName = collectionName.endsWith('-index')
          ? collectionName
          : `${collectionName}-index`
      }

      const urlPattern = normalizeDomain(domain)
      const params: Record<string, string> = {
        url: urlPattern,
        output: 'json',
        fl: 'url,timestamp,status,mime,length,offset,filename,digest',
        collapse: 'digest',
        limit: String(options.limit ?? 1000)
      }

      const fetchOptions = await createFetchOptions(baseURL, params, {
        timeout: options.timeout ?? 60_000,
        responseType: 'text'
      })

      try {
        const raw = await $fetch(`/${indexName}`, fetchOptions)
        const text = typeof raw === 'string' ? raw : String(raw)
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length === 0) {
          return createSuccessResponse([], 'commoncrawl', {
            collection: collectionName,
            queryParams: fetchOptions.params
          })
        }

        const records = lines.map(line => JSON.parse(line) as Record<string, string>)
        const pages: ArchivedPage[] = records.map(record => {
          const isoTimestamp = waybackTimestampToISO(record.timestamp || '')
          const cleanedUrl = cleanDoubleSlashes(record.url || '')
          const snapUrl = `${dataBaseURL}/${record.filename}`
          return {
            url: cleanedUrl,
            timestamp: isoTimestamp,
            snapshot: snapUrl,
            _meta: {
              timestamp: record.timestamp,
              status: Number.parseInt(record.status || '0', 10),
              digest: record.digest,
              mime: record.mime,
              length: record.length,
              offset: record.offset,
              filename: record.filename,
              collection: collectionName,
              provider: 'commoncrawl'
            } as CommonCrawlMetadata
          }
        })

        return createSuccessResponse(pages, 'commoncrawl', {
          collection: collectionName,
          count: pages.length,
          queryParams: fetchOptions.params
        })
      } catch (error: any) {
        return createErrorResponse(error, 'commoncrawl', { collection: collectionName })
      }
    }
  }
}

