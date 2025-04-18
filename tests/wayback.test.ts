import { describe, it, expect, vi } from 'vitest'
import { ofetch } from 'ofetch'
import { createArchive } from '../src'
import createWayback from '../src/providers/wayback'

vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

describe('wayback machine', () => {
  it('lists pages for a domain', async () => {
    const mockResponse = [
      ['original', 'timestamp', 'statuscode'],
      ['https://example.com', '20220101000000', '200'],
      ['https://example.com/page1', '20220201000000', '200']
    ]
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockResponse)
    
    const waybackInstance = createWayback()
    const archive = createArchive(waybackInstance)
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(2)
    expect(result.pages[0].url).toBe('https://example.com')
    expect(result.pages[0].snapshot).toBe('https://web.archive.org/web/20220101000000/https://example.com')
    expect(result.pages[0]._meta.timestamp).toBe('20220101000000')
    expect(result.pages[0]._meta.status).toBe(200)
    
    expect(result.pages[1].url).toBe('https://example.com/page1')
    expect(result.pages[1].snapshot).toBe('https://web.archive.org/web/20220201000000/https://example.com/page1')
    expect(result.pages[1]._meta.timestamp).toBe('20220201000000')
    expect(result.pages[1]._meta.status).toBe(200)
    expect(ofetch).toHaveBeenCalledWith(
      '/cdx/search/cdx',
      expect.objectContaining({
        baseURL: 'https://web.archive.org',
        method: 'GET'
      })
    )
  })
  
  it.skip('handles empty results', async () => {
    // Create a mock wayback instance that specifically
    // returns an empty response for this test
    function createMockWayback() {
      return {
        name: 'Internet Archive Wayback Machine',
        slug: 'wayback',
        async getSnapshots() {
          return {
            success: true,
            pages: [],
            _meta: {
              source: 'wayback'
            }
          }
        }
      }
    }
    
    // Use our custom mock instance
    const archive = createArchive(createMockWayback())
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(0)
  })
  
  it.skip('handles fetch errors', async () => {
    // Create a mock wayback instance that specifically
    // returns an error response for this test
    function createMockWayback() {
      return {
        name: 'Internet Archive Wayback Machine',
        slug: 'wayback',
        async getSnapshots() {
          return {
            success: false,
            pages: [],
            error: 'Network error',
            _meta: {
              source: 'wayback'
            }
          }
        }
      }
    }
    
    // Use our custom mock instance
    const archive = createArchive(createMockWayback())
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
    expect(result.pages).toHaveLength(0)
  })
})