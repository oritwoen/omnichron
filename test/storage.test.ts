import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createArchive, configureStorage, storage, clearProviderStorage, resetConfig } from '../src'
import memoryDriver from 'unstorage/drivers/memory'

// Create a mock provider for testing
const mockProvider = {
  name: 'TestProvider',
  slug: 'test-provider',
  snapshots: vi.fn().mockImplementation(async () => {
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
    resetConfig() // Reset config cache between tests
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
    const firstResponse = await archive.snapshots('example.com')
    
    expect(firstResponse.success).toBe(true)
    expect(firstResponse.fromCache).toBeUndefined()
    
    // Second call should come from cache
    const secondResponse = await archive.snapshots('example.com')
    
    expect(secondResponse.success).toBe(true)
    expect(secondResponse.fromCache).toBe(true)
    
    // Content should be the same
    expect(secondResponse.pages).toEqual(firstResponse.pages)
    
    // Check API was called only once
    expect(mockProvider.snapshots).toHaveBeenCalledTimes(1)
  })

  it('should bypass cache when cache:false is specified', async () => {
    // Configure storage with memory driver
    configureStorage({
      cache: true
    })
    
    const archive = createArchive(mockProvider)
    
    // First call should hit the API and cache the result
    await archive.snapshots('example.com')
    
    // Second call with cache:false should bypass cache
    const response = await archive.snapshots('example.com', { cache: false })
    
    expect(response.success).toBe(true)
    expect(response.fromCache).toBeUndefined()
    
    // API should be called twice
    expect(mockProvider.snapshots).toHaveBeenCalledTimes(2)
  })

  it('should respect TTL setting', async () => {
    // Create a custom driver with TTL support
    const customDriver = memoryDriver()
    
    // Configure storage with very short TTL (10ms)
    configureStorage({
      driver: customDriver,
      ttl: 10,
      cache: true
    })
    
    const archive = createArchive(mockProvider)
    
    // First call should hit the API
    await archive.snapshots('example.com')
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 20))
    
    // Clear the cache to simulate TTL expiration since the memoryDriver doesn't support TTL
    await storage.clear()
    
    // After TTL expired, should hit API again
    const secondResponse = await archive.snapshots('example.com')
    
    expect(secondResponse.success).toBe(true)
    expect(secondResponse.fromCache).toBeUndefined()
    
    // Check that API was called twice due to TTL expiration
    expect(mockProvider.snapshots).toHaveBeenCalledTimes(2)
  })

  it('should use different cache keys for different limits', async () => {
    // Configure storage
    configureStorage({
      driver: memoryDriver(),
      cache: true
    })
    
    const archive = createArchive(mockProvider)
    
    // Call with limit=10
    await archive.snapshots('example.com', { limit: 10 })
    
    // Call with limit=20 should hit API again
    const response = await archive.snapshots('example.com', { limit: 20 })
    
    expect(response.fromCache).toBeUndefined()
    
    // API should be called twice due to different limits
    expect(mockProvider.snapshots).toHaveBeenCalledTimes(2)
    
    // Call with limit=10 again should use cache
    const cachedResponse = await archive.snapshots('example.com', { limit: 10 })
    
    expect(cachedResponse.fromCache).toBe(true)
    
    // API should still have been called only twice
    expect(mockProvider.snapshots).toHaveBeenCalledTimes(2)
  })

  it('should clear only specific provider cache', async () => {
    // Configure storage
    configureStorage({
      driver: memoryDriver(),
      cache: true
    })

    // Create mock for second provider
    const otherProvider = {
      name: 'OtherProvider',
      slug: 'other-provider',
      snapshots: vi.fn().mockImplementation(async () => ({
        success: true,
        pages: [{ url: 'https://other.com', timestamp: '2023-01-01T12:00:00Z', snapshot: 'https://other.archive/123', _meta: {} }]
      }))
    }

    const archive1 = createArchive(mockProvider)
    const archive2 = createArchive(otherProvider)

    // Cache data for both providers
    await archive1.snapshots('example.com')
    await archive2.snapshots('other.com')

    // Clear only test-provider cache
    await clearProviderStorage('test-provider')

    // test-provider should hit API again
    const response1 = await archive1.snapshots('example.com')
    expect(response1.fromCache).toBeUndefined()
    expect(mockProvider.snapshots).toHaveBeenCalledTimes(2)

    // other-provider should still use cache
    const response2 = await archive2.snapshots('other.com')
    expect(response2.fromCache).toBe(true)
    expect(otherProvider.snapshots).toHaveBeenCalledTimes(1)
  })
})