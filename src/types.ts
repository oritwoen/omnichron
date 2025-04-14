export interface ArchiveOptions {
  // Pagination option
  limit?: number  // Maximum number of results to return
}

export interface ArchivedPage {
  // Common fields for all platforms
  url: string         // Original URL of the page
  timestamp: string   // ISO 8601 date format (YYYY-MM-DDTHH:mm:ss.sssZ)
  snapshot: string    // Direct URL to the archived version
  
  // Platform-specific metadata
  _meta: Record<string, any>
}

export interface ArchiveResponse {
  success: boolean
  pages: ArchivedPage[]
  error?: string
  
  // Platform-specific metadata
  _meta?: Record<string, any>
}

export interface ArchivePlatform {
  name: string
  getSnapshots: (domain: string, options?: ArchiveOptions) => Promise<ArchiveResponse>
}