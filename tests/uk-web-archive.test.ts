import { describe, it, expect, vi } from 'vitest'
import { ofetch } from 'ofetch'
import { createArchive } from '../src'
import createUkWebArchive from '../src/platforms/uk-web-archive'

vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

describe('UK Web Archive', () => {
  it('lists pages for a domain', async () => {
    const mockResponse = [
      ['original', 'timestamp', 'statuscode'],
      ['https://example.com', '20220101000000', '200'],
      ['https://example.com/page1', '20220201000000', '200']
    ]
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockResponse)
    
    const ukWebArchiveInstance = createUkWebArchive()
    const archive = createArchive(ukWebArchiveInstance)
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(2)
    expect(result.pages[0].url).toBe('https://example.com')
    expect(result.pages[0].snapshot).toBe('https://www.webarchive.org.uk/wayback/archive/web/20220101000000/https://example.com')
    expect(result.pages[0]._meta.timestamp).toBe('20220101000000')
    expect(result.pages[0]._meta.status).toBe(200)
    
    expect(result.pages[1].url).toBe('https://example.com/page1')
    expect(result.pages[1].snapshot).toBe('https://www.webarchive.org.uk/wayback/archive/web/20220201000000/https://example.com/page1')
    expect(result.pages[1]._meta.timestamp).toBe('20220201000000')
    expect(result.pages[1]._meta.status).toBe(200)
    expect(ofetch).toHaveBeenCalledWith(
      '/cdx/search/cdx',
      expect.objectContaining({
        baseURL: 'https://www.webarchive.org.uk/wayback/archive',
        method: 'GET'
      })
    )
  })
  
  it('handles empty results', async () => {
    const mockResponse = [
      ['original', 'timestamp', 'statuscode']
    ]
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockResponse)
    
    const ukWebArchiveInstance = createUkWebArchive()
    const archive = createArchive(ukWebArchiveInstance)
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(0)
  })
  
  it('handles fetch errors', async () => {
    vi.mocked(ofetch).mockRejectedValueOnce(new Error('Network error'))
    
    const ukWebArchiveInstance = createUkWebArchive()
    const archive = createArchive(ukWebArchiveInstance)
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
    expect(result.pages).toHaveLength(0)
  })
})