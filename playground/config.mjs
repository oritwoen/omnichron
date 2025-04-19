import { createArchive, getConfig, resolveConfig, resetConfig } from 'omnichron'
import wayback from 'omnichron/providers/wayback'
import fsDriver from 'unstorage/drivers/fs'

try {
  console.log('Configuration Demo\n')
  
  // Get current config (auto-loads from omnichron.config.ts)
  const config = await getConfig()
  console.log('Default config loaded from config file:')
  console.log(config)
  
  // Create archive with default config
  const _defaultArchive = createArchive(wayback())
  
  // Override with custom config
  console.log('\nOverriding config with custom options:')
  const customConfig = await resolveConfig({
    overrides: {
      storage: {
        driver: fsDriver({ base: './.cache' }), // Use filesystem driver
        ttl: 3600000, // 1 hour TTL
        prefix: 'custom' // Custom prefix
      },
      performance: {
        concurrency: 2,
        timeout: 10000
      }
    }
  })
  
  console.log('Custom config:')
  console.log(customConfig)
  
  // Create an archive with the custom config
  const _customArchive = createArchive(wayback(), {
    // Individual options can still be specified
    limit: 5,
    cache: true
  })
  
  // Environment-specific configs
  console.log('\nEnvironment-specific configurations:')
  
  // Development (NODE_ENV=development)
  process.env.NODE_ENV = 'development'
  resetConfig() // Clear cached config
  const devConfig = await getConfig()
  console.log('Development config:', {
    concurrency: devConfig.performance.concurrency,
    timeout: devConfig.performance.timeout,
    ttl: devConfig.storage.ttl
  })
  
  // Production (NODE_ENV=production)
  process.env.NODE_ENV = 'production'
  resetConfig() // Clear cached config
  const prodConfig = await getConfig()
  console.log('Production config:', {
    concurrency: prodConfig.performance.concurrency,
    timeout: prodConfig.performance.timeout,
    ttl: prodConfig.storage.ttl
  })
  
  // Test (NODE_ENV=test)
  process.env.NODE_ENV = 'test'
  resetConfig() // Clear cached config
  const testConfig = await getConfig()
  console.log('Test config:', {
    concurrency: testConfig.performance.concurrency,
    timeout: testConfig.performance.timeout,
    ttl: testConfig.storage.ttl,
    prefix: testConfig.storage.prefix
  })
  
  // Reset environment
  process.env.NODE_ENV = 'development'
  
  // Show how config affects createArchive
  console.log('\nFetching data with different configs:')
  
  const domain = 'example.com'
  const limit = 5
  
  console.log(`\nFetching snapshots for ${domain} with limit=${limit}...`)
  
  try {
    // Reset config to ensure environment is applied
    resetConfig()
    
    const archive = createArchive(wayback(), { limit })
    const response = await archive.getSnapshots(domain)
    
    console.log(`Found ${response.pages.length} snapshots`)
    console.log('First snapshot:', response.pages[0])
    
    // Show metadata
    console.log('\nConfig-influenced metadata:')
    console.log('- TTL:', customConfig.storage.ttl)
    console.log('- Prefix:', customConfig.storage.prefix)
    console.log('- Concurrency:', customConfig.performance.concurrency)
    console.log('- Storage driver:', customConfig.storage.driver.name || 'memory')
  } catch (error) {
    console.error('Error fetching snapshots:', error)
  }
  
} catch (error_) {
  console.error('Error:', error_)
}