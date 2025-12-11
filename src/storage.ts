import { createStorage } from 'unstorage'
import memoryDriver from 'unstorage/drivers/memory'
import { consola } from 'consola'
import type { ArchiveOptions, ArchiveResponse } from './types'
import { getConfig } from './config'

// Create a memory storage driver as default
// Using type assertion to add options property that createStorage doesn't include in type definition
export const storage = createStorage({
  driver: memoryDriver()
}) as unknown as Storage & { options?: { prefix?: string } }

/**
 * Initialize storage with configuration values
 * This is called internally when needed
 */
export async function initStorage(): Promise<void> {
  const config = await getConfig()
  
  if (config.storage.driver) {
    Object.assign(storage, createStorage({
      driver: config.storage.driver
    }))
  }
}

/**
 * Generate a storage key for a domain request
 */
export function generateStorageKey(
  provider: { name: string, slug?: string }, 
  domain: string, 
  options?: Pick<ArchiveOptions, 'limit'>
): string {
  // Use slug if available, otherwise use name
  const providerKey = provider.slug ?? provider.name
  const prefix = getStoragePrefix()
  const baseKey = `${prefix}:${providerKey}:${domain}`
  return options?.limit ? `${baseKey}:${options.limit}` : baseKey
}

/**
 * Get the current storage prefix
 */
function getStoragePrefix(): string {
  return storage.options?.prefix || 'omnichron'
}

/**
 * Get stored response if available
 */
export async function getStoredResponse(
  provider: { name: string, slug?: string },
  domain: string,
  options?: ArchiveOptions
): Promise<ArchiveResponse | undefined> {
  // Skip if cache is explicitly disabled
  if (options?.cache === false) {
    return undefined
  }

  // Ensure storage is initialized
  if (!storage.options) {
    await initStorage()
  }

  const key = generateStorageKey(provider, domain, options)
  
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
        consola.error(`Storage parse error for ${key}:`, parseError)
      }
    }
  } catch (error) {
    // Silently fail on storage errors
    consola.error(`Storage read error for ${key}:`, error)
  }
  
  return undefined
}

/**
 * Store response in storage
 */
export async function storeResponse(
  provider: { name: string, slug?: string },
  domain: string,
  response: ArchiveResponse,
  options?: ArchiveOptions
): Promise<void> {
  // Skip if cache is explicitly disabled or response was unsuccessful
  if (options?.cache === false || !response.success) {
    return
  }

  // Ensure storage is initialized
  if (!storage.options) {
    await initStorage()
  }

  const key = generateStorageKey(provider, domain, options)
  // ttl is configured at the driver level
  
  try {
    // Remove fromCache flag before storing
    const { fromCache: _fromCache, ...storableResponse } = response
    
    // Store stringified data
    // TTL will be handled by the storage driver's configuration
    await storage.setItem(key, JSON.stringify(storableResponse))
  } catch (error) {
    // Silently fail on storage errors
    consola.error(`Storage write error for ${key}:`, error)
  }
}

/**
 * Clear stored responses for a specific provider
 */
export async function clearProviderStorage(provider: string | { name: string, slug?: string }): Promise<void> {
  try {
    // Ensure storage is initialized
    if (!storage.options) {
      await initStorage()
    }

    // Convert provider to string key (either slug or name)
    const providerKey = typeof provider === 'string'
      ? provider
      : (provider.slug ?? provider.name)

    // Get all keys and filter by provider prefix
    const storagePrefix = getStoragePrefix()
    const providerPrefix = `${storagePrefix}:${providerKey}:`
    const keys = await storage.getKeys()

    for (const key of keys) {
      if (key.startsWith(providerPrefix)) {
        await storage.removeItem(key)
      }
    }
  } catch (error) {
    const providerName = typeof provider === 'string' ? provider : provider.name
    consola.error(`Failed to clear storage for provider ${providerName}:`, error)
  }
}

/**
 * Configure storage options and driver
 * @deprecated Use config file or options passed to createArchive instead
 */
export async function configureStorage(options: {
  driver?: any
  ttl?: number
  cache?: boolean
  prefix?: string
} = {}): Promise<void> {
  // Get current config to update
  const config = await getConfig()
  
  // Update config with provided options
  if (options.driver) {
    config.storage.driver = options.driver
  }
  
  if (options.ttl !== undefined) {
    config.storage.ttl = options.ttl
  }
  
  if (options.cache !== undefined) {
    config.storage.cache = options.cache
  }
  
  if (options.prefix !== undefined) {
    storage.options = storage.options || {}
    storage.options.prefix = options.prefix
  }
  
  // Update storage with new driver if provided
  if (options.driver) {
    const newStorage = createStorage({
      driver: options.driver
    }) as unknown as Storage & { options?: { prefix?: string } }
    
    newStorage.options = newStorage.options || {}
    newStorage.options.prefix = storage.options?.prefix || config.storage.prefix
    
    // Replace the storage instance
    Object.assign(storage, newStorage)
  }
}