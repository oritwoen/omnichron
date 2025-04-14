import { describe, it, expect, vi } from 'vitest'
import { createArchive } from '../src'
import createWayback from '../src/platforms/wayback'
import type { ArchivePlatform } from '../src/types'

describe('createArchive', () => {
  it('accepts a platform instance', () => {
    const waybackInstance = createWayback()
    expect(() => createArchive(waybackInstance)).not.toThrow()
  })
  
  it('returns platform api', () => {
    const waybackInstance = createWayback()
    const archive = createArchive(waybackInstance)
    
    expect(archive).toHaveProperty('getSnapshots')
    expect(typeof archive.getSnapshots).toBe('function')
  })
  
  it('merges global and request options', async () => {
    // Create a mock platform
    const mockPlatform: ArchivePlatform = {
      name: 'Mock Platform',
      listPages: vi.fn().mockResolvedValue({ success: true, pages: [] })
    }
    
    const globalOptions = { 
      timeout: 5_000
    }
    
    const requestOptions = {
      timeout: 10_000,
      limit: 100
    }
    
    const archive = createArchive(mockPlatform, globalOptions)
    await archive.listPages('example.com', requestOptions)
    
    expect(mockPlatform.listPages).toHaveBeenCalledWith(
      'example.com',
      {
        timeout: 10_000,
        limit: 100
      }
    )
  })
})