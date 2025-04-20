import { createArchive, providers } from 'omnichron'

// Przykład asynchronicznego tworzenia archiwum
const main = async () => {
  try {
    console.log('Przykład pojedynczego dostawcy:')
    // Używanie pojedynczego dostawcy z opcjami wydajnościowymi
    const waybackArchive = createArchive(await providers.wayback({
      concurrency: 3,
      batchSize: 25,
      timeout: 20000,
      retries: 2,
      limit: 5
    }))
    
    const waybackPages = await waybackArchive.getSnapshots('example.com')
    console.log('Wayback Machine:', waybackPages.pages.length, 'stron')
    console.log(waybackPages.pages[0])
    
    console.log('\nPrzykład wielu dostawców:')
    // Używanie wielu dostawców z lazy-loading
    const multiArchive = createArchive([
      providers.wayback(),
      providers.archiveToday(),
      providers.webcite()
    ], {
      concurrency: 5,
      batchSize: 30,
      timeout: 30000,
      retries: 3,
      limit: 10
    })
    
    const multiPages = await multiArchive.getSnapshots('example.com')
    console.log('Łącznie znaleziono:', multiPages.pages.length, 'stron')
    console.log('Strony według dostawcy:')
    
    // Grupowanie według dostawcy
    const byProvider = {}
    for (const page of multiPages.pages) {
      const provider = page._meta?.provider || 'unknown'
      byProvider[provider] = (byProvider[provider] || 0) + 1
    }
    
    console.log(byProvider)
    console.log('Przykładowa strona:', multiPages.pages[0])

    // Używanie pomocniczej metody 'all'
    console.log('\nUżywanie providers.all():')
    const allArchive = createArchive(providers.all({
      limit: 5,
      timeout: 15000
    }))
    
    const allPages = await allArchive.getSnapshots('example.com')
    console.log('Wszystkie strony:', allPages.pages.length)

    // Używanie API łańcuchowego
    console.log('\nUżywanie API łańcuchowego:')
    const chainArchive = createArchive(await providers.wayback())
    
    // Dodawanie kolejnych dostawców
    await chainArchive.use(providers.archiveToday())
    await chainArchive.use(providers.webcite())

    const chainPages = await chainArchive.getSnapshots('example.com', { limit: 5 })
    console.log('Łańcuch dostawców znalazł:', chainPages.pages.length, 'stron')

  } catch (error) {
    console.error('Błąd:', error)
  }
}

main()