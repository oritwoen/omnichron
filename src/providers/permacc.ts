import { $fetch } from "ofetch";
import { cleanDoubleSlashes } from "ufo";
import type { ArchiveProvider, ArchiveResponse, ArchivedPage } from "../types";
import type { PermaccOptions } from "../_providers";
import {
  createSuccessResponse,
  createErrorResponse,
  createFetchOptions,
  mergeOptions,
  normalizeDomain,
} from "../utils";

/**
 * Create a Perma.cc archive provider.
 *
 * @param initOptions - Initial Perma.cc options including required `apiKey` and cache settings.
 * @returns ArchiveProvider instance for fetching snapshots from Perma.cc.
 */
export default function permacc(initOptions: Partial<PermaccOptions> = {}): ArchiveProvider {
  return {
    name: "Perma.cc",
    slug: "permacc",

    /**
     * Fetch archived snapshots from Perma.cc.
     *
     * @param domain - The domain to fetch archives for.
     * @param reqOptions - Request-specific Perma.cc options (e.g., apiKey, limit).
     * @returns Promise resolving to ArchiveResponse containing pages and metadata.
     */
    async snapshots(
      domain: string,
      reqOptions: Partial<PermaccOptions> = {},
    ): Promise<ArchiveResponse> {
      try {
        const options = await mergeOptions<PermaccOptions>(initOptions, reqOptions);

        if (!options.apiKey) {
          throw new Error("API key is required for Perma.cc");
        }

        const baseUrl = "https://api.perma.cc";
        const snapshotUrl = "https://perma.cc";
        const { apiKey } = options;
        const cleanDomain = normalizeDomain(domain, false);

        const fetchOptions = await createFetchOptions(
          baseUrl,
          {
            limit: options.limit ?? 100,
            url: cleanDomain,
          },
          {
            headers: {
              Authorization: `ApiKey ${apiKey}`,
            },
            retries: options.retries,
            timeout: options.timeout,
          },
        );

        interface PermaccArchive {
          guid: string;
          url: string;
          title: string;
          creation_timestamp: string;
          status: string;
          created_by: {
            id: string;
          };
        }

        interface PermaccResponse {
          objects: PermaccArchive[];
          meta: {
            limit: number;
            offset: number;
            total_count: number;
          };
        }

        const response = (await $fetch("/v1/public/archives/", fetchOptions)) as PermaccResponse;

        if (!response.objects || response.objects.length === 0) {
          return createSuccessResponse([], "permacc", { queryParams: fetchOptions.params });
        }

        const pages: ArchivedPage[] = response.objects
          .filter((item) => item.url && item.url.includes(cleanDomain))
          .map((item) => {
            const cleanedUrl = cleanDoubleSlashes(item.url);
            const snapUrl = `${snapshotUrl}/${item.guid}`;
            const timestamp = item.creation_timestamp ?? new Date().toISOString();

            const page: ArchivedPage = {
              url: cleanedUrl,
              timestamp,
              snapshot: snapUrl,
              _meta: {
                guid: item.guid,
                title: item.title,
                status: item.status,
                created_by: item.created_by?.id,
              },
            };

            return page;
          });

        return createSuccessResponse(pages, "permacc", {
          queryParams: fetchOptions.params,
          meta: response.meta ?? {},
        });
      } catch (error) {
        return createErrorResponse(error, "permacc");
      }
    },
  };
}
