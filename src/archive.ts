import type { ArchiveOptions, ArchiveResponse, ArchiveProvider } from './types'

export function createArchive(provider: ArchiveProvider, options?: ArchiveOptions) {
  return {
    async getSnapshots(domain: string, listOptions?: ArchiveOptions): Promise<ArchiveResponse> {
      return await provider.getSnapshots(domain, { ...options, ...listOptions })
    }
  }
}