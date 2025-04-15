import { createArchive } from 'omnichron'
import createUkWebArchive from 'omnichron/providers/uk-web-archive'

// Create a UK Web Archive platform instance
const ukWebArchive = createUkWebArchive()

// Create an archive client with the UK Web Archive platform
const archive = createArchive(ukWebArchive)

// Fetch snapshots for a domain
try {
  // Get snapshots for example.com
  const response = await archive.getSnapshots('example.com', {
    // Optional limit
    limit: 10
  })
  
  if (response.success) {
    console.log('UK Web Archive snapshots:', response.pages)
  } else {
    console.error('Error:', response.error)
  }
} catch (error_) {
  console.error('Exception:', error_)
}
