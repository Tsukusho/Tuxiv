import { Storage } from '@google-cloud/storage';
import { env } from '@/lib/env';

const storage = new Storage({
  projectId: env.GCS_PROJECT_ID,
  credentials: {
    client_email: env.GCS_CLIENT_EMAIL,
    private_key: env.GCS_PRIVATE_KEY,
  },
});

export const bucket = storage.bucket(env.GCS_BUCKET_NAME);