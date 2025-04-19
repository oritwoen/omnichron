import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ofetch } from 'ofetch'
import createMementoTime from '../src/providers/memento-time'

// Mock ofetch
vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

// Clear mocks before each test
beforeEach(() => {
  vi.resetAllMocks()
})

describe('memento time travel provider', () => {
  it('lists pages for a domain', async () => {
    const mockResponse = {
      mementos: {
        list: [
          {
            uri: 'https://web.archive.org/web/20220101000000/https://example.com',
            datetime: 'Sat, 01 Jan 2022 00:00:00 GMT',
            archive: 'Internet Archive'
          },
          {
            uri: 'https://archive.ph/abc123/https://example.com',
            datetime: 'Tue, 01 Feb 2022 00:00:00 GMT',
            archive: 'Archive.today'
          }
        ]
      },
      original_uri: 'https://example.com',
      timemap_uri: {
        json_format: 'https://timetravel.mementoweb.org/timemap/json/https://example.com'
      }
    }
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockResponse)
    
    const mementoTime = createMementoTime()
    const result = await mementoTime.getSnapshots('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(2)
    expect(result.pages[0].url).toBe('https://example.com')
    expect(result.pages[0].snapshot).toBe('https://web.archive.org/web/20220101000000/https://example.com')
    expect(result.pages[0]._meta.originalTimestamp).toBe('Sat, 01 Jan 2022 00:00:00 GMT')
    expect(result.pages[0]._meta.source).toBe('Internet Archive')
    
    expect(ofetch).toHaveBeenCalledWith(
      '/timemap/json/https://example.com',
      expect.objectContaining({
        baseURL: 'https://timetravel.mementoweb.org',
        method: 'GET'
      })
    )
  })
  
  it('handles empty results correctly', async () => {
    const mockEmptyResponse = {
      mementos: {
        list: []
      },
      original_uri: 'https://example.com',
      timemap_uri: {
        json_format: 'https://timetravel.mementoweb.org/timemap/json/https://example.com'
      }
    }
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockEmptyResponse)
    
    const mementoTime = createMementoTime()
    const result = await mementoTime.getSnapshots('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(0)
  })
  
  it('handles errors correctly', async () => {
    const errorMessage = 'Network error'
    
    vi.mocked(ofetch).mockRejectedValueOnce(new Error(errorMessage))
    
    const mementoTime = createMementoTime()
    const result = await mementoTime.getSnapshots('example.com')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe(errorMessage)
    expect(result.pages).toHaveLength(0)
  })
  
  it('applies limit to results', async () => {
    const mockResponse = {
      mementos: {
        list: Array.from({length: 10}, (_, i) => ({
          uri: `https://web.archive.org/web/2022010${i}000000/https://example.com`,
          datetime: `Sat, 0${i+1} Jan 2022 00:00:00 GMT`,
          archive: 'Internet Archive'
        }))
      },
      original_uri: 'https://example.com',
      timemap_uri: {
        json_format: 'https://timetravel.mementoweb.org/timemap/json/https://example.com'
      }
    }
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockResponse)
    
    const mementoTime = createMementoTime()
    const result = await mementoTime.getSnapshots('example.com', { limit: 5 })
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(5)
  })
})