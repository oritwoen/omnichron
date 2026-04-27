import { $fetch } from "ofetch";
import type { ArchiveOptions, ArchiveProvider, ArchiveResponse, ArchivedPage } from "../types";
import {
  normalizeDomain,
  createSuccessResponse,
  createErrorResponse,
  createFetchOptions,
  mergeOptions,
  mapCdxRows,
} from "../utils";

/**
 * Create a Wayback Machine archive provider.
 *
 * @param initOptions - Initial archive options (limit, cache, ttl) for Wayback queries.
 * @returns ArchiveProvider instance for fetching snapshots from the Wayback Machine.
 */
export default function wayback(initOptions: ArchiveOptions = {}): ArchiveProvider {
  return {
    name: "Internet Archive Wayback Machine",
    slug: "wayback",

    /**
     * Fetch archived snapshots from the Internet Archive Wayback Machine.
     *
     * @param domain - The domain to search for archived snapshots.
     * @param reqOptions - Request-specific options overriding initial settings.
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async snapshots(domain: string, reqOptions: ArchiveOptions = {}): Promise<ArchiveResponse> {
      try {
        const options = await mergeOptions(initOptions, reqOptions);
        const baseUrl = "https://web.archive.org";
        const snapshotUrl = "https://web.archive.org/web";
        const urlPattern = normalizeDomain(domain);

        const fetchOptions = await createFetchOptions(
          baseUrl,
          {
            url: urlPattern,
            output: "json",
            fl: "original,timestamp,statuscode",
            collapse: "timestamp:4", // collapse by year to reduce results
            limit: String(options.limit ?? 1000),
          },
          {
            retries: options.retries,
            timeout: options.timeout,
          },
        );

        type WaybackResponse = [string[], ...string[][]];
        const response = (await $fetch("/cdx/search/cdx", fetchOptions)) as WaybackResponse;

        // first row is the header
        if (!Array.isArray(response) || response.length <= 1) {
          return createSuccessResponse([], "wayback", { queryParams: fetchOptions.params || {} });
        }

        const dataRows = response.slice(1);
        const pages: ArchivedPage[] = await mapCdxRows(
          dataRows,
          snapshotUrl,
          "wayback",
          options,
        );

        return createSuccessResponse(pages, "wayback", { queryParams: fetchOptions.params || {} });
      } catch (error) {
        return createErrorResponse(error, "wayback");
      }
    },
  };
}
