import { createArchive, providers } from "omnichron";

const archive = createArchive(
  providers.wayback({
    timeout: 60_000,
  }),
);

export default defineEventHandler(async () => {
  const snapshots = await archive.snapshots("example.com");

  return snapshots;
});
