import { describe, it, expect, vi } from 'vitest'
import { ofetch } from 'ofetch'
import { createArchive as createArchiveClient } from '../src'
import createArchiveToday from '../src/platforms/archive-today'

vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

describe('archive.today', () => {
  it('lists pages for a domain', async () => {
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
    const result = await archive.listPages('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(2)
    expect(result.pages[0].url).toBe('https://example.com')
    expect(result.pages[0].snapshot).toBe('https://archive.ph/abc123/https://example.com')
    expect(result.pages[0]._meta.raw_date).toBe('01 Jan 2022')
    expect(result.pages[0]._meta.hash).toBe('abc123')
    
    expect(result.pages[1].url).toBe('https://example.com/page1')
    expect(result.pages[1].snapshot).toBe('https://archive.ph/def456/https://example.com/page1')
    expect(result.pages[1]._meta.raw_date).toBe('02 Feb 2022')
    expect(result.pages[1]._meta.hash).toBe('def456')
    expect(ofetch).toHaveBeenCalledWith(
      '/example.com',
      expect.objectContaining({
        baseURL: 'https://archive.ph',
        method: 'GET'
      })
    )
  })
  
  it('handles empty results', async () => {
    const mockHtml = `<html><body>No snapshots found</body></html>`
    
    vi.mocked(ofetch).mockResolvedValueOnce(mockHtml)
    
    const archiveInstance = createArchiveToday()
    const archive = createArchiveClient(archiveInstance)
    const result = await archive.listPages('example.com')
    
    expect(result.success).toBe(true)
    expect(result.pages).toHaveLength(0)
  })
  
  it('handles fetch errors', async () => {
    vi.mocked(ofetch).mockRejectedValueOnce(new Error('Network error'))
    
    const archiveInstance = createArchiveToday()
    const archive = createArchiveClient(archiveInstance)
    const result = await archive.listPages('example.com')
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
    expect(result.pages).toHaveLength(0)
  })
})