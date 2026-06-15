import { Storage } from "@google-cloud/storage";
import { env } from "@/lib/env";

const storage = new Storage({
  projectId: env.GCS_PROJECT_ID,
  credentials: {
    client_email: env.GCS_CLIENT_EMAIL,
    private_key: env.GCS_PRIVATE_KEY,
  },
});

export const bucket = storage.bucket(env.GCS_BUCKET_NAME);

export async function getReadSignedUrl(path: string, ttlMs = 24 * 60 * 60 * 1000): Promise<string | null> {
  try {
    const [url] = await bucket.file(path).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + ttlMs,
    });
    return url;
  } catch {
    return null;
  }
}
export async function getReadSignedUrls(paths: string[], ttlMs = 24 * 60 * 60 * 1000): Promise<(string | null)[]> {
  return Promise.all(paths.map((path) => getReadSignedUrl(path, ttlMs)));
}
