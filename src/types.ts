export interface ArchiveOptions {
  // Pagination option
  limit?: number  // Maximum number of results to return
}

export interface ArchivedPage {
  // Common fields for all providers
  url: string         // Original URL of the page
  timestamp: string   // ISO 8601 date format (YYYY-MM-DDTHH:mm:ss.sssZ)
  snapshot: string    // Direct URL to the archived version
  
  // Provider-specific metadata
  _meta: Record<string, any>
}

export interface ArchiveResponse {
  success: boolean
  pages: ArchivedPage[]
  error?: string
  
  // Provider-specific metadata
  _meta?: Record<string, any>
}

export interface ArchiveProvider {
  name: string
  getSnapshots: (domain: string, options?: ArchiveOptions) => Promise<ArchiveResponse>
}

