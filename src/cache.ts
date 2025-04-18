import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import type { ArchiveOptions, ArchiveResponse } from './types'

// Default cache TTL (7 days in milliseconds)
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000

// Default cache configuration
const defaultCacheConfig = {
  cache: true,
  ttl: DEFAULT_TTL
}

// Create a memory storage driver as default
const storage = createStorage({
  driver: memoryDriver()
})

/**
 * Generate a cache key for a domain request
 */
export function generateCacheKey(
  providerName: string, 
  domain: string, 
  options?: Pick<ArchiveOptions, 'limit'>
): string {
  const key = `${providerName}:${domain}`
  return options?.limit ? `${key}:${options.limit}` : key
}

/**
 * Get cached response if available
 */
export async function getCachedResponse(
  providerName: string,
  domain: string,
  options?: ArchiveOptions
): Promise<ArchiveResponse | undefined> {
  // Skip if cache is explicitly disabled
  if (options?.cache === false) {
    return undefined
  }

  const key = generateCacheKey(providerName, domain, options)
  
  try {
    const cachedData = await storage.getItem(key)
    
    if (cachedData) {
      try {
        // Add fromCache flag to response
        const parsedData = typeof cachedData === 'string' 
          ? JSON.parse(cachedData)
          : cachedData
        
        return {
          ...parsedData,
          fromCache: true
        }
      } catch (parseError) {
        console.error(`Cache parse error for ${key}:`, parseError)
      }
    }
  } catch (error) {
    // Silently fail on cache errors
    console.error(`Cache read error for ${key}:`, error)
  }
  
  return undefined
}

/**
 * Store response in cache
 */
export async function cacheResponse(
  providerName: string,
  domain: string,
  response: ArchiveResponse,
  options?: ArchiveOptions
): Promise<void> {
  // Skip if cache is explicitly disabled or response was unsuccessful
  if (options?.cache === false || !response.success) {
    return
  }

  const key = generateCacheKey(providerName, domain, options)
  const ttl = options?.ttl ?? defaultCacheConfig.ttl
  
  try {
    // Remove fromCache flag before storing
    const { fromCache: _fromCache, ...storableResponse } = response
    
    // Store stringified data with TTL
    await storage.setItem(key, JSON.stringify(storableResponse), {
      ttl
    })
  } catch (error) {
    // Silently fail on cache errors
    console.error(`Cache write error for ${key}:`, error)
  }
}

/**
 * Clear all cached responses
 */
export async function clearCache(): Promise<void> {
  try {
    const keys = await storage.getKeys()
    await Promise.all(keys.map(key => storage.removeItem(key)))
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

/**
 * Clear cached responses for a specific provider
 */
export async function clearProviderCache(providerName: string): Promise<void> {
  try {
    const keys = await storage.getKeys()
    const providerKeys = keys.filter(key => key.startsWith(`${providerName}:`))
    await Promise.all(providerKeys.map(key => storage.removeItem(key)))
  } catch (error) {
    console.error(`Failed to clear cache for provider ${providerName}:`, error)
  }
}

/**
 * Configure cache options and storage
 */
export function configureCache(options: {
  driver?: any
  ttl?: number
  cache?: boolean
} = {}): void {
  // Update default options
  if (options.ttl !== undefined) {
    defaultCacheConfig.ttl = options.ttl
  }
  
  if (options.cache !== undefined) {
    defaultCacheConfig.cache = options.cache
  }
  
  // Set custom storage driver if provided
  if (options.driver) {
    // Create new storage with provided driver
    const newStorage = createStorage({
      driver: options.driver
    })
    
    // Replace the storage instance
    Object.assign(storage, newStorage)
  }
}