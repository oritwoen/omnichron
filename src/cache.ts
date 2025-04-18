import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import { consola } from 'consola'
import type { ArchiveOptions, ArchiveResponse } from './types'

// Default cache TTL (7 days in milliseconds)
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000

// Default cache configuration
const defaultCacheConfig = {
  cache: true,
  ttl: DEFAULT_TTL,
  prefix: 'omnichron'
}

// Create a memory storage driver as default
export const storage = createStorage({
  driver: memoryDriver()
})

/**
 * Generate a cache key for a domain request
 */
export function generateCacheKey(
  provider: { name: string, slug?: string }, 
  domain: string, 
  options?: Pick<ArchiveOptions, 'limit'>
): string {
  // Use slug if available, otherwise use name
  const providerKey = provider.slug ?? provider.name
  const prefix = defaultCacheConfig.prefix
  const baseKey = `${prefix}:${providerKey}:${domain}`
  return options?.limit ? `${baseKey}:${options.limit}` : baseKey
}

/**
 * Get cached response if available
 */
export async function getCachedResponse(
  provider: { name: string, slug?: string },
  domain: string,
  options?: ArchiveOptions
): Promise<ArchiveResponse | undefined> {
  // Skip if cache is explicitly disabled
  if (options?.cache === false) {
    return undefined
  }

  const key = generateCacheKey(provider, domain, options)
  
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
        consola.error(`Cache parse error for ${key}:`, parseError)
      }
    }
  } catch (error) {
    // Silently fail on cache errors
    consola.error(`Cache read error for ${key}:`, error)
  }
  
  return undefined
}

/**
 * Store response in cache
 */
export async function cacheResponse(
  provider: { name: string, slug?: string },
  domain: string,
  response: ArchiveResponse,
  options?: ArchiveOptions
): Promise<void> {
  // Skip if cache is explicitly disabled or response was unsuccessful
  if (options?.cache === false || !response.success) {
    return
  }

  const key = generateCacheKey(provider, domain, options)
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
    consola.error(`Cache write error for ${key}:`, error)
  }
}


/**
 * Clear cached responses for a specific provider
 */
export async function clearProviderCache(provider: string | { name: string, slug?: string }): Promise<void> {
  try {
    // Convert provider to string key (either slug or name)
    const providerKey = typeof provider === 'string' 
      ? provider 
      : (provider.slug ?? provider.name)
    
    // Use the full prefix with the provider key
    const prefix = `${defaultCacheConfig.prefix}:${providerKey}`
    
    // Use the clear method with base to remove all keys with this prefix
    await storage.clear(prefix)
  } catch (error) {
    const providerName = typeof provider === 'string' ? provider : provider.name
    consola.error(`Failed to clear cache for provider ${providerName}:`, error)
  }
}

/**
 * Configure cache options and storage
 */
export function configureCache(options: {
  driver?: any
  ttl?: number
  cache?: boolean
  prefix?: string
} = {}): void {
  // Update default options
  if (options.ttl !== undefined) {
    defaultCacheConfig.ttl = options.ttl
  }
  
  if (options.cache !== undefined) {
    defaultCacheConfig.cache = options.cache
  }
  
  if (options.prefix !== undefined) {
    defaultCacheConfig.prefix = options.prefix
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