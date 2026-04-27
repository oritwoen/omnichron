import type { ArchiveProvider, ArchiveResponse } from "../types";
import type { WebCiteOptions } from "../_providers";
import { createUnsupportedResponse } from "../utils";

const UNSUPPORTED_LIST_REASON =
  "WebCite has no list-by-domain API. Existing snapshots can be fetched directly via webcitation.org/<id>; new archives have not been accepted since ~2019.";

/**
 * Create a WebCite archive provider.
 *
 * Note: WebCite does not expose a list-by-domain endpoint, so `snapshots(domain)`
 * always returns an unsupported response. Existing snapshots are still
 * retrievable via direct webcitation.org/<id> URLs once a `getById` API is
 * added at the aggregator level.
 *
 * @param initOptions - Initial archive options for WebCite queries (currently unused).
 * @returns ArchiveProvider instance for WebCite.
 */
export default function webcite(_initOptions: Partial<WebCiteOptions> = {}): ArchiveProvider {
  return {
    name: "WebCite",
    slug: "webcite",

    async snapshots(
      _domain: string,
      _reqOptions: Partial<WebCiteOptions> = {},
    ): Promise<ArchiveResponse> {
      return createUnsupportedResponse(UNSUPPORTED_LIST_REASON, "webcite", {
        operation: "snapshots",
      });
    },
  };
}
