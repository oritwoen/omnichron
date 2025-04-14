import { describe, it, expect, vi } from 'vitest'
import { ofetch } from 'ofetch'
import { createArchive } from '../src'
import createCommonCrawl from '../src/platforms/commoncrawl'

vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

describe('Common Crawl', () => {
  it('lists pages for a domain', async () => {
    const mockResponse = {
      lines: [
        ['org,example)/', '20220101000000', 'https://example.com', 'text/html', '200', 'AAAABBBCCCDD', '12345'],
        ['org,example)/page1', '20220202000000', 'https://example.com/page1', 'text/html', '200', 'EEEFFGGHHII', '23456']
      ],
      pageCount: 1,
      blocks_with_urls: 2
    }
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockResponse)
    
    const ccInstance = createCommonCrawl()
    const archive = createArchive(ccInstance)
    const result = await archive.listPages('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(2)
    
    // Check first result
    expect(result.pages[0].url).toBe('https://example.com')
    expect(result.pages[0].timestamp).toBe('2022-01-01T00:00:00Z')
    expect(result.pages[0].snapshot).toMatch(/https:\/\/data\.commoncrawl\.org\/warc\/CC-MAIN-latest\/AAAABBBCCCDD/)
    expect(result.pages[0]._meta.status).toBe(200)
    expect(result.pages[0]._meta.collection).toBe('CC-MAIN-latest')
    
    // Check second result
    expect(result.pages[1].url).toBe('https://example.com/page1')
    expect(result.pages[1].snapshot).toMatch(/https:\/\/data\.commoncrawl\.org\/warc\/CC-MAIN-latest\/EEEFFGGHHII/)
    
    // Check if the query was made with correct parameters
    expect(ofetch).toHaveBeenCalledWith(
      '/CC-MAIN-latest/cdx',
      expect.objectContaining({
        baseURL: 'https://index.commoncrawl.org',
        method: 'GET',
        params: expect.objectContaining({
          url: 'example.com/*',
          output: 'json'
        })
      })
    )
  })
  
  it('handles empty results', async () => {
    // CommonCrawl returns an object with an empty lines array
    const mockResponse = {
      lines: [],
      pageCount: 0,
      blocks_with_urls: 0
    }
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockResponse)
    
    const ccInstance = createCommonCrawl()
    const archive = createArchive(ccInstance)
    const result = await archive.listPages('nonexistentdomain.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(0)
    expect(result._meta?.source).toBe('commoncrawl')
  })
  
  it('handles fetch errors', async () => {
    vi.mocked(ofetch).mockRejectedValueOnce(new Error('Network error'))
    
    const ccInstance = createCommonCrawl({ collection: 'CC-MAIN-2023-50' })
    const archive = createArchive(ccInstance)
    const result = await archive.listPages('example.com')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
    expect(result.pages).toHaveLength(0)
    expect(result._meta?.collection).toBe('CC-MAIN-2023-50')
  })
  
  it('supports collection option', async () => {
    // Simple mock, we're just testing query parameters
    vi.mocked(ofetch).mockResolvedValueOnce({ lines: [] })
    
    const ccInstance = createCommonCrawl({
      collection: 'CC-MAIN-2023-50',
      limit: 50
    })
    
    const archive = createArchive(ccInstance)
    await archive.listPages('example.com')
    
    expect(ofetch).toHaveBeenCalledWith(
      '/CC-MAIN-2023-50/cdx',
      expect.objectContaining({
        params: expect.objectContaining({
          limit: '50'
        })
      })
    )
  })
})