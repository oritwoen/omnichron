// @ts-check

import { createArchive, configureCache, clearCache } from '../dist/index.mjs'
import wayback from '../dist/providers/wayback.mjs'
import driver from 'unstorage/drivers/fs'

// Print title banner
console.log('='.repeat(60))
console.log('OMNICHRON CACHE DEMO')
console.log('Demonstrating caching capabilities with Wayback Machine')
console.log('='.repeat(60))

// Configure cache with memory driver (in-memory caching)
configureCache({
  driver: driver({
    base: './cache', // Path to store cache files
  }),
  ttl: 60 * 60 * 1000, // 1 hour cache TTL
  cache: true // Enable caching by default
})

const domain = 'example.com'
const waybackArchive = createArchive(wayback())

async function runDemo() {
  // First call - will fetch from API
  console.log('\n--- First request (from API) ---')
  console.time('First request')
  const firstResponse = await waybackArchive.getSnapshots(domain, { limit: 3 })
  console.timeEnd('First request')
  console.log(`From cache: ${!!firstResponse.fromCache}`)
  console.log(`Found ${firstResponse.pages.length} pages`)
  
  if (firstResponse.pages.length > 0) {
    console.log('First page:')
    console.log(firstResponse.pages[0])
  }

  // Second call with same parameters - should come from cache
  console.log('\n--- Second request (from cache) ---')
  console.time('Second request')
  const secondResponse = await waybackArchive.getSnapshots(domain, { limit: 3 })
  console.timeEnd('Second request')
  console.log(`From cache: ${!!secondResponse.fromCache}`)
  console.log(`Found ${secondResponse.pages.length} pages`)

  // Third call with cache disabled - forces API refresh
  console.log('\n--- Third request (with cache disabled) ---')
  console.time('Third request')
  const thirdResponse = await waybackArchive.getSnapshots(domain, { 
    limit: 3,
    cache: false // Bypass cache for this request
  })
  console.timeEnd('Third request')
  console.log(`From cache: ${!!thirdResponse.fromCache}`)
  console.log(`Found ${thirdResponse.pages.length} pages`)

  // Clear the entire cache
  console.log('\n--- Clearing cache ---')
  await clearCache()
  console.log('Cache cleared')

  // Fourth call after cache clear - fetches from API again
  console.log('\n--- Fourth request (after cache clear) ---')
  console.time('Fourth request')
  const fourthResponse = await waybackArchive.getSnapshots(domain, { limit: 3 })
  console.timeEnd('Fourth request')
  console.log(`From cache: ${!!fourthResponse.fromCache}`)
  console.log(`Found ${fourthResponse.pages.length} pages`)
}

await runDemo().catch(console.error)
