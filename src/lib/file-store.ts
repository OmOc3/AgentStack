import type { GeneratedFile } from "@/lib/stacks";

const FILE_STORE_TTL_MS = 10 * 60 * 1000;

export const fileStore = new Map<
  string,
  { files: GeneratedFile[]; createdAt: number }
>();

export function storeGeneratedFiles(files: GeneratedFile[]) {
  const createdAt = Date.now();
  const previewId = crypto.randomUUID().slice(0, 8);

  evictExpiredFiles(createdAt);
  fileStore.set(previewId, { files, createdAt });

  return previewId;
}

export function getStoredFiles(previewId: string) {
  const entry = fileStore.get(previewId);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.createdAt > FILE_STORE_TTL_MS) {
    fileStore.delete(previewId);
    return null;
  }

  return entry.files;
}

function evictExpiredFiles(now: number) {
  for (const [previewId, entry] of fileStore) {
    if (now - entry.createdAt > FILE_STORE_TTL_MS) {
      fileStore.delete(previewId);
    }
  }
}
