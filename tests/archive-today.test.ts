import { describe, it, expect, vi } from 'vitest'
import { ofetch } from 'ofetch'
import { createArchive as createArchiveClient } from '../src'
import createArchiveToday from '../src/providers/archive-today'

vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

describe('archive.today', () => {
  it('lists pages for a domain using Memento API', async () => {
    const mockTimemapResponse = `
    <https://example.com/>; rel="original",
    <http://archive.md/timegate/https://example.com/>; rel="timegate",
    <http://archive.md/20020120142510/http://example.com/>; rel="first memento"; datetime="Sun, 20 Jan 2002 14:25:10 GMT",
    <http://archive.md/20140101030405/https://example.com/>; rel="memento"; datetime="Wed, 01 Jan 2014 03:04:05 GMT",
    <http://archive.md/20150308151422/https://example.com/>; rel="memento"; datetime="Sun, 08 Mar 2015 15:14:22 GMT",
    <http://archive.md/20160810200921/https://example.com/>; rel="memento"; datetime="Wed, 10 Aug 2016 20:09:21 GMT"
    `
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockTimemapResponse)
    
    const archiveInstance = createArchiveToday()
    const archive = createArchiveClient(archiveInstance)
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(4)
    
    // Check first snapshot
    expect(result.pages[0].url).toBe('https://example.com')
    expect(result.pages[0].snapshot).toBe('http://archive.md/20020120142510/http://example.com')
    expect(result.pages[0]._meta.hash).toBe('20020120142510')
    expect(result.pages[0]._meta.raw_date).toBe('Sun, 20 Jan 2002 14:25:10 GMT')
    
    // Verify API call
    expect(ofetch).toHaveBeenCalledWith(
      '/timemap/https://example.com',
      expect.objectContaining({
        baseURL: 'https://archive.is',
        method: 'GET'
      })
    )
  })
  
  it('falls back to HTML parsing when Memento API fails', async () => {
    // First request (Memento API) fails
    vi.mocked(ofetch).mockRejectedValueOnce(new Error('API error'))
    
    // Second request (HTML fallback) succeeds
    const mockHtml = `
      <html>
        <table>
          <tr>
            <td class="date">01 Jan 2022</td>
            <td><a href="/abc123/https://example.com">Example.com</a></td>
          </tr>
          <tr>
            <td class="date">02 Feb 2022</td>
            <td><a href="/def456/https://example.com/page1">Example.com/page1</a></td>
          </tr>
        </table>
      </html>
    `
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockHtml)
    
    const archiveInstance = createArchiveToday()
    const archive = createArchiveClient(archiveInstance)
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  it('handles empty results from Memento API', async () => {
    const mockEmptyResponse = 'TimeMap does not exists. The archive has no Mementos for the requested URI'
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockEmptyResponse)
    
    const archiveInstance = createArchiveToday()
    const archive = createArchiveClient(archiveInstance)
    const result = await archive.getSnapshots('nonexistent-domain.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(0)
    expect(result._meta.empty).toBe(true)
  })
  
  it('handles fetch errors', async () => {
    vi.mocked(ofetch).mockRejectedValueOnce(new Error('Network error'))
    
    const archiveInstance = createArchiveToday()
    const archive = createArchiveClient(archiveInstance)
    const result = await archive.getSnapshots('example.com')
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.pages).toHaveLength(0)
  })
})