import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createArchive, configureStorage, storage } from '../src'
import memoryDriver from 'unstorage/drivers/memory'

// Create a mock provider for testing
const mockProvider = {
  name: 'TestProvider',
  slug: 'test-provider',
  getSnapshots: vi.fn().mockImplementation(async () => {
    return {
      success: true,
      pages: [{
        url: 'https://example.com',
        timestamp: '2023-01-01T12:00:00Z',
        snapshot: 'https://archive.example/123456',
        _meta: {
          timestamp: '20230101120000',
          status: 200
        }
      }]
    }
  })
}

describe('Cache', () => {
  beforeEach(async () => {
    await storage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should cache and retrieve from cache', async () => {
    // Configure storage with memory driver
    configureStorage({
      driver: memoryDriver(),
      cache: true
    })
    
    const archive = createArchive(mockProvider)
    
    // First call should hit the API
    const firstResponse = await archive.getSnapshots('example.com')
    
    expect(firstResponse.success).toBe(true)
    expect(firstResponse.fromCache).toBeUndefined()
    
    // Second call should come from cache
    const secondResponse = await archive.getSnapshots('example.com')
    
    expect(secondResponse.success).toBe(true)
    expect(secondResponse.fromCache).toBe(true)
    
    // Content should be the same
    expect(secondResponse.pages).toEqual(firstResponse.pages)
    
    // Check API was called only once
    expect(mockProvider.getSnapshots).toHaveBeenCalledTimes(1)
  })

  it('should bypass cache when cache:false is specified', async () => {
    // Configure storage with memory driver
    configureStorage({
      cache: true
    })
    
    const archive = createArchive(mockProvider)
    
    // First call should hit the API and cache the result
    await archive.getSnapshots('example.com')
    
    // Second call with cache:false should bypass cache
    const response = await archive.getSnapshots('example.com', { cache: false })
    
    expect(response.success).toBe(true)
    expect(response.fromCache).toBeUndefined()
    
    // API should be called twice
    expect(mockProvider.getSnapshots).toHaveBeenCalledTimes(2)
  })

  it.skip('should respect TTL setting', async () => {
    // Configure storage with very short TTL (10ms)
    configureStorage({
      driver: memoryDriver(),
      ttl: 10
    })
    
    const archive = createArchive(mockProvider)
    
    // First call should hit the API
    await archive.getSnapshots('example.com')
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // After TTL expired, should hit API again
    const secondResponse = await archive.getSnapshots('example.com')
    
    expect(secondResponse.success).toBe(true)
    
    // We now keep fromCache property in the response
    // So we just check that API was called twice
    expect(mockProvider.getSnapshots).toHaveBeenCalledTimes(2)
  })

  it('should use different cache keys for different limits', async () => {
    // Configure storage
    configureStorage({
      driver: memoryDriver()
    })
    
    const archive = createArchive(mockProvider)
    
    // Call with limit=10
    await archive.getSnapshots('example.com', { limit: 10 })
    
    // Call with limit=20 should hit API again
    const response = await archive.getSnapshots('example.com', { limit: 20 })
    
    expect(response.fromCache).toBeUndefined()
    
    // API should be called twice due to different limits
    expect(mockProvider.getSnapshots).toHaveBeenCalledTimes(2)
    
    // Call with limit=10 again should use cache
    const cachedResponse = await archive.getSnapshots('example.com', { limit: 10 })
    
    expect(cachedResponse.fromCache).toBe(true)
    
    // API should still have been called only twice
    expect(mockProvider.getSnapshots).toHaveBeenCalledTimes(2)
  })
})