import type { ArchiveOptions, ArchiveResponse, ArchivePlatform } from './types'

export function createArchive(platform: ArchivePlatform, options?: ArchiveOptions) {
  return {
    async getSnapshots(domain: string, listOptions?: ArchiveOptions): Promise<ArchiveResponse> {
      return await platform.getSnapshots(domain, { ...options, ...listOptions })
    }
  }
}