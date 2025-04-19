import { createArchive } from 'omnichron'
import wayback from 'omnichron/providers/wayback'

/**
 * This example demonstrates the batch processing capabilities
 * for handling large datasets with minimal memory usage
 */

// Helper to measure memory usage
const getMemoryUsage = () => {
  const used = process.memoryUsage()
  return {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100 + ' MB',
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
    external: Math.round(used.external / 1024 / 1024 * 100) / 100 + ' MB'
  }
}

// Helper to process data
const processData = (data, batchSize) => {
  console.log(`Processing ${data.length} items in batches of ${batchSize}...`)
  
  console.time('Processing time')
  const startMemory = getMemoryUsage()
  console.log('Memory before processing:', startMemory)
  
  let processed = 0
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    
    // Simulate processing
    batch.forEach(item => {
      processed++
      const result = item.toString().repeat(10).length
      if (result === Infinity) console.log('Impossible!')
    })
    
    // Log progress every 5 batches
    if (i % (batchSize * 5) === 0 && i > 0) {
      console.log(`Processed ${processed}/${data.length} items (${Math.round(processed / data.length * 100)}%)`)
    }
  }
  
  console.timeEnd('Processing time')
  const endMemory = getMemoryUsage()
  console.log('Memory after processing:', endMemory)
  
  return processed
}

try {
  console.log('Batch Processing Performance Demo\n')
  
  // Create test data array
  const largeDataset = Array.from({ length: 10000 }, (_, i) => `Item ${i}`)
  console.log(`Created test dataset with ${largeDataset.length} items`)
  
  // First try: No batching (all at once)
  console.log('\n1. Processing without batching:')
  const noBatchResult = processData(largeDataset, largeDataset.length)
  
  // Second try: Medium batches 
  console.log('\n2. Processing with medium batches:')
  const mediumBatchResult = processData(largeDataset, 500)
  
  // Third try: Small batches
  console.log('\n3. Processing with small batches:')
  const smallBatchResult = processData(largeDataset, 50)
  
  console.log('\nSummary:')
  console.log('- No batching processed:', noBatchResult, 'items')
  console.log('- Medium batches processed:', mediumBatchResult, 'items')
  console.log('- Small batches processed:', smallBatchResult, 'items')
  
  // Now show with real archive data
  console.log('\nReal-world example with Wayback Machine:')
  
  // Create archives with different batch sizes
  const largeBatchArchive = createArchive(wayback(), { 
    batchSize: 100,
    concurrency: 3,
    limit: 200 
  })
  
  const smallBatchArchive = createArchive(wayback(), { 
    batchSize: 10,
    concurrency: 3,
    limit: 200 
  })
  
  // Fetch with large batches
  console.log('\nFetching with large batches (100):')
  console.time('Large batch fetch')
  const memBefore1 = getMemoryUsage()
  const largeResult = await largeBatchArchive.getSnapshots('example.com')
  console.timeEnd('Large batch fetch')
  const memAfter1 = getMemoryUsage()
  
  console.log('Memory before:', memBefore1.heapUsed)
  console.log('Memory after:', memAfter1.heapUsed)
  console.log('Found', largeResult.pages.length, 'snapshots')
  
  // Fetch with small batches
  console.log('\nFetching with small batches (10):')
  console.time('Small batch fetch')
  const memBefore2 = getMemoryUsage()
  const smallResult = await smallBatchArchive.getSnapshots('example.com')
  console.timeEnd('Small batch fetch')
  const memAfter2 = getMemoryUsage()
  
  console.log('Memory before:', memBefore2.heapUsed)
  console.log('Memory after:', memAfter2.heapUsed)
  console.log('Found', smallResult.pages.length, 'snapshots')
  
  console.log('\nBatch processing helps manage memory usage with large datasets!')
  console.log('You can tune batch size based on your memory constraints and performance needs.')
  
} catch (error_) {
  console.error('Error:', error_.message)
  if (error_.cause) console.error('Cause:', error_.cause)
}