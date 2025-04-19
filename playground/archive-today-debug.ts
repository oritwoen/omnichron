import { ofetch } from 'ofetch'

// Archive.today debug script

async function testArchiveToday(domain: string) {
  console.log(`Testing archive.today search for domain: ${domain}`)
  
  // Base URL configuration
  const baseUrl = 'https://archive.ph'
  
  // Search query formats to try
  const searchFormats = [
    `/search/?q=${encodeURIComponent(domain)}`,
    `/${domain}*`,
    `/*/https://${domain}`,
    `/*/http://${domain}`
  ]
  
  for (const searchUrl of searchFormats) {
    console.log(`\nTrying URL format: ${baseUrl}${searchUrl}`)
  
  try {
    console.log('Fetching search page...')
    const searchHtml = await ofetch(searchUrl, {
      baseURL: baseUrl,
      timeout: 10000, // 10 seconds
      retry: 1
    })
    
    console.log(`Search page size: ${searchHtml.length} bytes`)
    
    // Log a small sample of the response to see the structure
    const sampleSize = 500
    console.log(`\nResponse sample (first ${sampleSize} chars):\n${searchHtml.slice(0, sampleSize)}`)
    
    // Check for link patterns (debug our regex)
    console.log('\nChecking for archive links...')
    const linkRegex = /<a[^>]*href="\/([a-zA-Z0-9]+)\/(https?:\/\/[^"]+)"[^>]*>(.*?)<\/a>/g
    const dateRegex = /<td class="date">([^<]+)<\/td>/g
    
    // Extract all dates
    const dates: string[] = []
    let dateMatch
    while ((dateMatch = dateRegex.exec(searchHtml)) !== null) {
      dates.push(dateMatch[1])
    }
    console.log(`Found ${dates.length} dates:`, dates.slice(0, 5))
    
    // Extract all links
    const links: { hash: string, url: string, text: string }[] = []
    let linkMatch
    let index = 0
    
    while ((linkMatch = linkRegex.exec(searchHtml)) !== null) {
      if (linkMatch[2].includes(domain)) {
        links.push({
          hash: linkMatch[1],
          url: linkMatch[2],
          text: linkMatch[3].trim()
        })
        index++
      }
    }
    
    console.log(`Found ${links.length} links for domain ${domain}:`)
    for (let i = 0; i < Math.min(links.length, 5); i++) {
      console.log(`- ${links[i].url} (${links[i].hash})`)
    }
    
    // Try alternative link patterns
    console.log('\nTrying alternative link patterns...')
    const altLinkRegex = /<a href="\/([^\/]+)\/([^"]+)"[^>]*>([^<]+)<\/a>/g
    const altLinks: { hash: string, url: string, text: string }[] = []
    
    let altMatch
    while ((altMatch = altLinkRegex.exec(searchHtml)) !== null) {
      altLinks.push({
        hash: altMatch[1],
        url: altMatch[2],
        text: altMatch[3].trim()
      })
    }
    
    console.log(`Found ${altLinks.length} links with alternative regex:`)
    for (let i = 0; i < Math.min(altLinks.length, 5); i++) {
      console.log(`- ${altLinks[i].url} (${altLinks[i].hash})`)
    }
    
    // Look for tables that might contain archive links
    console.log('\nChecking for tables in the page...')
    const tableSections = searchHtml.match(/<table[^>]*>[\s\S]*?<\/table>/g)
    if (tableSections && tableSections.length > 0) {
      console.log(`Found ${tableSections.length} tables`)
      
      // Check for rows in the first table that might have archive links
      if (tableSections.length > 0) {
        const tableRows = tableSections[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/g)
        if (tableRows && tableRows.length > 0) {
          console.log(`First table has ${tableRows.length} rows`)
          
          // Show a sample of the table rows
          for (let i = 0; i < Math.min(tableRows.length, 3); i++) {
            console.log(`Row ${i+1} sample: ${tableRows[i].slice(0, 100)}...`)
          }
        }
      }
    } else {
      console.log('No tables found in the response')
    }
    
    // Try to find any archive links by looking for specific patterns
    console.log('\nFinding potential archive links:')
    const allLinksRegex = /<a[^>]*href="([^"]+)"[^>]*>/g
    const allLinks: string[] = []
    
    let allMatch
    while ((allMatch = allLinksRegex.exec(searchHtml)) !== null) {
      // Look for archive links in various formats
      if (
        (allMatch[1].startsWith('/') && allMatch[1].includes('/http')) || 
        (allMatch[1].startsWith('/20') || allMatch[1].startsWith('/19')) || // Year-based links
        (allMatch[1].match(/\/[a-zA-Z0-9]{5,}\//)) // Hash-based links
      ) {
        allLinks.push(allMatch[1])
      }
    }
    
    console.log(`Found ${allLinks.length} potential archive links:`)
    for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
      console.log(`- ${allLinks[i]}`)
    }
    
    // Check for the presence of specific sections in the response
    console.log('\nChecking for specific sections:')
    const sections = [
      { name: 'List-like sections', pattern: /<div[^>]*id="list"[^>]*>/ },
      { name: 'Result container', pattern: /<div[^>]*class="results"[^>]*>/ },
      { name: 'Main content', pattern: /<div[^>]*id="main"[^>]*>/ },
      { name: 'Content section', pattern: /<div[^>]*id="content"[^>]*>/ }
    ]
    
    for (const section of sections) {
      const found = searchHtml.match(section.pattern) !== null
      console.log(`- ${section.name}: ${found ? 'Found' : 'Not found'}`)
    }
    
  } catch (error: any) {
    console.error('Error fetching from archive.ph:')
    console.error(`Status: ${error.status}`)
    console.error(`Message: ${error.message}`)
  }
  } // End of for loop
}

// Test with example.com
await testArchiveToday('example.com')