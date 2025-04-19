export interface ArchiveOptions {
  // Pagination option
  limit?: number  // Maximum number of results to return
  
  // Caching options
  cache?: boolean // Enable/disable caching
  ttl?: number    // Cache TTL in milliseconds
}

// Base metadata interface with common properties
export interface ArchiveMetadata {
  [key: string]: unknown;
  timestamp?: string;  // Original timestamp format from the provider
  status?: number;     // HTTP status code of the archived page
}

// Provider-specific metadata definitions
export interface WaybackMetadata extends ArchiveMetadata {
  timestamp: string;
  status: number;
}

export interface CommonCrawlMetadata extends ArchiveMetadata {
  timestamp: string;
  status: number;
  digest?: string;
  mime?: string;
  length?: string;
  collection: string;
}

export interface PermaccMetadata extends ArchiveMetadata {
  guid: string;
  title?: string;
  status?: string;
  created_by?: string;
}

export interface ArchiveTodayMetadata extends ArchiveMetadata {
  hash: string;
  raw_date?: string;
  position?: number;
}

export interface UkWebArchiveMetadata extends ArchiveMetadata {
  timestamp: string;
  status: number;
}

export interface ArchivedPage {
  // Common fields for all providers
  url: string         // Original URL of the page
  timestamp: string   // ISO 8601 date format (YYYY-MM-DDTHH:mm:ss.sssZ)
  snapshot: string    // Direct URL to the archived version
  
  // Provider-specific metadata with improved typing
  _meta: ArchiveMetadata
}

// Type for response metadata
export interface ResponseMetadata {
  source: string;
  errorDetails?: unknown;
  errorName?: string;
  queryParams?: Record<string, string>;
  [key: string]: unknown;
}

export interface ArchiveResponse {
  success: boolean;
  pages: ArchivedPage[];
  error?: string;
  
  // Provider-specific metadata
  _meta?: ResponseMetadata;
  
  // Cache info
  fromCache?: boolean;
}

// Discriminated union for typed responses
export type ArchiveResult = 
  | { success: true; pages: ArchivedPage[]; _meta?: ResponseMetadata; fromCache?: boolean }
  | { success: false; error: string; pages: never[]; _meta?: ResponseMetadata; fromCache?: boolean };

export interface ArchiveProvider {
  name: string;
  slug?: string;
  getSnapshots: (domain: string, options?: ArchiveOptions) => Promise<ArchiveResponse>;
}

// Read-only types for immutable data
export type ReadonlyArchivedPage = Readonly<ArchivedPage>;
export type ReadonlyArchiveResponse = Readonly<ArchiveResponse>;