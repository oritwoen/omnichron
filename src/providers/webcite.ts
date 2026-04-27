import { $fetch } from "ofetch";
import type { ArchiveProvider, ArchiveResponse, ArchivedPage } from "../types";
import type { WebCiteOptions } from "../_providers";
import {
  normalizeDomain,
  createSuccessResponse,
  createErrorResponse,
  createFetchOptions,
  mergeOptions,
} from "../utils";

/**
 * Create a WebCite archive provider.
 *
 * Note: WebCite is currently not accepting new archiving requests, but existing
 * archives remain accessible.
 *
 * @param initOptions - Initial archive options for WebCite queries.
 * @returns ArchiveProvider instance for fetching snapshots from WebCite.
 */
export default function webcite(initOptions: Partial<WebCiteOptions> = {}): ArchiveProvider {
  return {
    name: "WebCite",
    slug: "webcite",

    /**
     * Fetch archived snapshots from WebCite.
     *
     * @param domain - The domain to search for archived snapshots.
     * @param reqOptions - Request-specific options overriding initial settings.
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async snapshots(
      domain: string,
      reqOptions: Partial<WebCiteOptions> = {},
    ): Promise<ArchiveResponse> {
      try {
        const options = await mergeOptions(initOptions, reqOptions);
        const cleanDomain = normalizeDomain(domain, false);
        const baseUrl = "https://www.webcitation.org";

        const fetchOptions = await createFetchOptions(
          baseUrl,
          {
            url: encodeURIComponent(cleanDomain),
          },
          {
            retries: options.retries,
            timeout: options.timeout ?? 30000,
          },
        );
        const queryPath = "/query";

        try {
          const response = await $fetch(queryPath, fetchOptions);

          // WebCite is read-only; the query endpoint returns either an archived
          // page snapshot or a static "not accepting requests" notice.
          const isNotFound =
            typeof response === "string" &&
            response.includes("We are currently not accepting archiving requests");

          const pages: ArchivedPage[] = [];

          if (!isNotFound && response) {
            // WebCite has no public listing API, so timestamp is a placeholder
            // and requestId is generic.
            pages.push({
              url: cleanDomain,
              timestamp: new Date().toISOString(),
              snapshot: `${baseUrl}/query?url=${encodeURIComponent(cleanDomain)}`,
              _meta: {
                requestId: "webcite-archive",
                provider: "webcite",
              },
            });
          }

          return createSuccessResponse(pages, "webcite", {
            domain: cleanDomain,
            empty: pages.length === 0,
            queryParams: fetchOptions.params,
            isAvailable: !isNotFound,
          });
        } catch (fetchError) {
          return createErrorResponse(fetchError, "webcite", {
            domain: cleanDomain,
          });
        }
      } catch (error) {
        return createErrorResponse(error, "webcite", {
          domain,
        });
      }
    },
  };
}
