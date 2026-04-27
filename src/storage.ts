import { createStorage, type Storage, type Driver } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";
import { consola } from "consola";
import type { ArchiveOptions, ArchiveResponse } from "./types";
import { getConfig } from "./config";

export const storage: Storage = createStorage({
  driver: memoryDriver(),
});

let storagePrefix = "omnichron";
let storageInitialized = false;

/**
 * Initialize storage with configuration values
 * This is called internally when needed
 */
export async function initStorage(): Promise<void> {
  const config = await getConfig();

  if (config.storage.driver) {
    Object.assign(
      storage,
      createStorage({
        driver: config.storage.driver,
      }),
    );
  }

  if (config.storage.prefix) {
    storagePrefix = config.storage.prefix;
  }

  storageInitialized = true;
}

/**
 * Generate a storage key for a domain request
 */
export function generateStorageKey(
  provider: { name: string; slug?: string },
  domain: string,
  options?: Pick<ArchiveOptions, "limit">,
): string {
  const providerKey = provider.slug ?? provider.name;
  const baseKey = `${storagePrefix}:${providerKey}:${domain}`;
  return options?.limit ? `${baseKey}:${options.limit}` : baseKey;
}

/**
 * Get stored response if available
 */
export async function getStoredResponse(
  provider: { name: string; slug?: string },
  domain: string,
  options?: ArchiveOptions,
): Promise<ArchiveResponse | undefined> {
  if (options?.cache === false) {
    return undefined;
  }

  if (!storageInitialized) {
    await initStorage();
  }

  const key = generateStorageKey(provider, domain, options);

  try {
    const cachedData = await storage.getItem(key);

    if (cachedData) {
      try {
        const parsedData = typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;

        return {
          ...(parsedData as ArchiveResponse),
          fromCache: true,
        };
      } catch (parseError) {
        consola.error(`Storage parse error for ${key}:`, parseError);
      }
    }
  } catch (error) {
    consola.error(`Storage read error for ${key}:`, error);
  }

  return undefined;
}

/**
 * Store response in storage
 */
export async function storeResponse(
  provider: { name: string; slug?: string },
  domain: string,
  response: ArchiveResponse,
  options?: ArchiveOptions,
): Promise<void> {
  if (options?.cache === false || !response.success) {
    return;
  }

  if (!storageInitialized) {
    await initStorage();
  }

  const key = generateStorageKey(provider, domain, options);

  try {
    const { fromCache: _fromCache, ...storableResponse } = response;
    await storage.setItem(key, JSON.stringify(storableResponse));
  } catch (error) {
    consola.error(`Storage write error for ${key}:`, error);
  }
}

/**
 * Clear stored responses for a specific provider
 */
export async function clearProviderStorage(
  provider: string | { name: string; slug?: string },
): Promise<void> {
  try {
    if (!storageInitialized) {
      await initStorage();
    }

    const providerKey = typeof provider === "string" ? provider : (provider.slug ?? provider.name);
    const providerPrefix = `${storagePrefix}:${providerKey}:`;
    const keys = await storage.getKeys();

    for (const key of keys) {
      if (key.startsWith(providerPrefix)) {
        await storage.removeItem(key);
      }
    }
  } catch (error) {
    const providerName = typeof provider === "string" ? provider : provider.name;
    consola.error(`Failed to clear storage for provider ${providerName}:`, error);
  }
}

/**
 * Configure storage options and driver
 * @deprecated Use config file or options passed to createArchive instead
 */
export async function configureStorage(
  options: {
    driver?: Driver;
    ttl?: number;
    cache?: boolean;
    prefix?: string;
  } = {},
): Promise<void> {
  const config = await getConfig();

  if (options.driver) {
    config.storage.driver = options.driver;
  }

  if (options.ttl !== undefined) {
    config.storage.ttl = options.ttl;
  }

  if (options.cache !== undefined) {
    config.storage.cache = options.cache;
  }

  if (options.prefix !== undefined) {
    storagePrefix = options.prefix;
  }

  if (options.driver) {
    Object.assign(
      storage,
      createStorage({
        driver: options.driver,
      }),
    );
  }

  storageInitialized = true;
}
