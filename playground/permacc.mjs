import { createArchive } from 'omnichron'
import permacc from 'omnichron/providers/permacc'

// Replace with your own Perma.cc API key
const API_KEY = 'YOUR_API_KEY'

// Create Perma.cc instance
const permaccInstance = permacc({ 
  apiKey: API_KEY,
  // Optional configuration
  limit: 50
})

// Create archive using Perma.cc
const archive = createArchive(permaccInstance)

// Example usage
const domain = 'example.com'

// Call function when API_KEY is updated
if (API_KEY === 'YOUR_API_KEY') {
  console.log('⚠️ To use this example, update the API_KEY in permacc.mjs')
} else {
  console.log(`Looking for archives for domain: ${domain}`)
  
  try {
    const result = await archive.getSnapshots(domain)
    
    if (result.success) {
      console.log(`Found ${result.pages.length} archived pages:`)
      
      for (const [index, page] of result.pages.entries()) {
        console.log(`\n[${index + 1}] ${page.url}`)
        console.log(`   📅 Date: ${page.timestamp}`)
        console.log(`   🔗 Link: ${page.snapshot}`)
        console.log(`   🆔 GUID: ${page._meta.guid}`)
        if (page._meta.title) {
          console.log(`   📝 Title: ${page._meta.title}`)
        }
      }
    } else {
      console.error(`Error: ${result.error}`)
    }
  } catch (error) {
    console.error('Unexpected error occurred:', error)
  }
}
