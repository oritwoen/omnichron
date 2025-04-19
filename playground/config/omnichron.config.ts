// Omnichron configuration file
import memoryDriver from 'unstorage/drivers/memory'
import type { OmnichronConfig } from '../../src/config'

/**
 * Main configuration for Omnichron
 * This file is automatically loaded when importing from 'omnichron'
 */
export default <OmnichronConfig>{
  // Storage configuration
  storage: {
    // Default to memory driver
    driver: memoryDriver({ size: 2000 }), // Limit to 2000 items
    cache: true,                          // Enable caching by default
    ttl: 3 * 24 * 60 * 60 * 1000,         // 3 days TTL (default)
    prefix: 'omnichron'                   // Prefix for all storage keys
  },
  
  // Performance configuration
  performance: {
    concurrency: 5,     // Concurrent requests (default)
    batchSize: 50,      // Items to process in each batch 
    timeout: 30000,     // Request timeout in ms (30 seconds)
    retries: 2          // Number of retries for failed requests
  },
  
  // Environment-specific configurations
  $development: {
    performance: {
      concurrency: 3,   // Use lower concurrency in development
      timeout: 60000    // Use longer timeout in development
    }
  },
  
  $production: {
    storage: {
      ttl: 7 * 24 * 60 * 60 * 1000 // 7 days TTL in production
    }
  },
  
  $test: {
    storage: {
      ttl: 100,         // Very short TTL for testing
      prefix: 'test'    // Different prefix for test environment
    },
    performance: {
      concurrency: 2,   // Lower concurrency for predictable tests
      timeout: 5000     // Short timeout for tests
    }
  }
}