import { createArchive } from 'omnichron'
import commonCrawl from 'omnichron/providers/commoncrawl'

// Create CommonCrawl instance with optional parameters
const commonCrawlInstance = commonCrawl({
  // Specify collection (or use default 'CC-MAIN-latest')
  collection: 'CC-MAIN-2023-50',
  
  // Optional configuration
  limit: 50
})

// Create archive using CommonCrawl
const archive = createArchive(commonCrawlInstance)

// Example usage
const domain = 'example.com'

console.log(`Looking for archives for domain: ${domain} in collection CC-MAIN-2023-50`)

try {
  const result = await archive.getSnapshots(domain)
  
  if (result.success) {
    console.log(`Found ${result.pages.length} archived pages:`)
    
    for (const [index, page] of result.pages.entries()) {
      console.log(`\n[${index + 1}] ${page.url}`)
      console.log(`   📅 Date: ${page.timestamp}`)
      console.log(`   🔗 Link: ${page.snapshot}`)
      console.log(`   ℹ️ Status: ${page._meta.status}`)
      console.log(`   📝 MIME: ${page._meta.mime}`)
      console.log(`   🔍 Digest: ${page._meta.digest}`)
    }
    
    // Display response metadata
    if (result._meta) {
      console.log('\nMetadata:')
      console.log(`   📊 Page count: ${result._meta.pageCount || 0}`)
      console.log(`   📦 Blocks with URLs: ${result._meta.blocks_with_urls || 0}`)
      console.log(`   🏷️ Collection: ${result._meta.collection}`)
    }
  } else {
    console.error(`Error: ${result.error}`)
  }
} catch (error) {
  console.error('Unexpected error occurred:', error)
}
