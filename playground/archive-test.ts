import { ofetch } from 'ofetch';

// Normalize a domain without wildcard
function normalizeDomain(domain: string): string {
  // Remove protocol if present
  return domain.replace(/^https?:\/\//i, '');
}

// Create fetch options
function createFetchOptions(baseURL: string, params: Record<string, any> = {}) {
  return {
    method: 'GET',
    baseURL,
    params,
    retry: 3,
    retryDelay: 300
  };
}

async function testArchiveToday() {
  // Use archive.ph as the base URL
  const baseUrl = 'https://archive.ph';
  const domain = 'example.com';
  const cleanDomain = normalizeDomain(domain);
  
  console.log(`Testing archive.ph for domain: ${cleanDomain}`);
  
  // Test direct search page fetch (the one that's giving 404)
  try {
    const fetchOptions = createFetchOptions(baseUrl, {
      t: Date.now(), // Add cache buster to avoid cached results
    });
    
    console.log(`Fetching ${baseUrl}/search/?q=${cleanDomain}`);
    const html = await ofetch(`/search/?q=${encodeURIComponent(cleanDomain)}`, fetchOptions);
    
    console.log('Result length:', html.length);
    console.log('First 100 characters:', html.slice(0, 100));
  } catch (error: any) {
    console.error('Error fetching from archive.ph:');
    console.error(`Status: ${error.status}`);
    console.error(`Message: ${error.message}`);
    
    // Try with archive.today instead
    try {
      const altBaseUrl = 'https://archive.today';
      const altFetchOptions = createFetchOptions(altBaseUrl, {
        t: Date.now(),
      });
      
      console.log(`\nTrying alternate URL: ${altBaseUrl}/search/?q=${cleanDomain}`);
      const altHtml = await ofetch(`/search/?q=${encodeURIComponent(cleanDomain)}`, altFetchOptions);
      
      console.log('Result length:', altHtml.length);
      console.log('First 100 characters:', altHtml.slice(0, 100));
    } catch (altError: any) {
      console.error('Error fetching from archive.today:');
      console.error(`Status: ${altError.status}`);
      console.error(`Message: ${altError.message}`);
    }
    
    // Try with URL format
    try {
      console.log('\nTrying URL format...');
      const urlHtml = await ofetch(`${baseUrl}/search/?q=${encodeURIComponent(domain)}`, {
        retry: 3,
        retryDelay: 300
      });
      
      console.log('Result length:', urlHtml.length);
      console.log('First 100 characters:', urlHtml.slice(0, 100));
    } catch (urlError: any) {
      console.error('Error fetching with URL format:');
      console.error(`Status: ${urlError.status}`);
      console.error(`Message: ${urlError.message}`);
    }
  }
}

// Use top-level await instead of promise chain
try {
  await testArchiveToday();
} catch (error) {
  console.error('Unhandled error:', error);
}