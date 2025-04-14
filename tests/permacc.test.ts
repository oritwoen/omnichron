import { describe, it, expect, vi, beforeEach } from 'vitest'
import createPermacc from '../src/platforms/permacc'
import { PermaccOptions } from '../src/_platforms'

// Mock fetch
vi.mock('ofetch', () => {
  return {
    ofetch: vi.fn().mockImplementation(() => {
      return {
        objects: [
          {
            guid: 'ABC123',
            url: 'https://example.com/page',
            title: 'Example Page',
            creation_timestamp: '2023-01-01T12:00:00Z',
            status: 'success',
            created_by: { id: 'user1' }
          }
        ],
        meta: {
          limit: 100,
          offset: 0,
          total_count: 1
        }
      }
    })
  }
})

describe('Perma.cc Platform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require an API key', async () => {
    const permacc = createPermacc({} as PermaccOptions)
    const result = await permacc.getSnapshots('example.com')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('API key is required for Perma.cc')
  })

  it('should fetch and format archived pages', async () => {
    const permacc = createPermacc({ apiKey: 'test_key' })
    const result = await permacc.getSnapshots('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(1)
    
    const page = result.pages[0]
    expect(page.url).toBe('https://example.com/page')
    expect(page.timestamp).toBe('2023-01-01T12:00:00Z')
    expect(page.snapshot).toBe('https://perma.cc/ABC123')
    expect(page._meta.guid).toBe('ABC123')
  })

  it('should support the limit option', async () => {
    const permacc = createPermacc({ 
      apiKey: 'test_key',
      limit: 50
    })
    
    const result = await permacc.getSnapshots('example.com')
    expect(result.success).toBe(true)
    expect(result.pages[0].snapshot).toBe('https://perma.cc/ABC123')
  })
})