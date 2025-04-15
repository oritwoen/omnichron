import { describe, it, expect, vi } from 'vitest'
import { createArchive } from '../src'
import createWayback from '../src/providers/wayback'
import type { ArchiveProvider } from '../src/types'

describe('createArchive', () => {
  it('accepts a provider instance', () => {
    const waybackInstance = createWayback()
    expect(() => createArchive(waybackInstance)).not.toThrow()
  })
  
  it('returns provider api', () => {
    const waybackInstance = createWayback()
    const archive = createArchive(waybackInstance)
    
    expect(archive).toHaveProperty('getSnapshots')
    expect(typeof archive.getSnapshots).toBe('function')
  })
  
  it('merges global and request options', async () => {
    // Create a mock provider
    const mockProvider: ArchiveProvider = {
      name: 'Mock Provider',
      getSnapshots: vi.fn().mockResolvedValue({ success: true, pages: [] })
    }
    
    const globalOptions = { 
      timeout: 5_000
    }
    
    const requestOptions = {
      timeout: 10_000,
      limit: 100
    }
    
    const archive = createArchive(mockProvider, globalOptions)
    await archive.getSnapshots('example.com', requestOptions)
    
    expect(mockProvider.getSnapshots).toHaveBeenCalledWith(
      'example.com',
      {
        timeout: 10_000,
        limit: 100
      }
    )
  })
})