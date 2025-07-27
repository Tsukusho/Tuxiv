import { Storage } from '@google-cloud/storage';

const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID;
const GCS_CLIENT_EMAIL = process.env.GCS_CLIENT_EMAIL;
const GCS_PRIVATE_KEY = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!GCS_PROJECT_ID || !GCS_CLIENT_EMAIL || !GCS_PRIVATE_KEY) {
  throw new Error('GCS environment variables are not properly set.');
}

const storage = new Storage({
  projectId: GCS_PROJECT_ID,
  credentials: {
    client_email: GCS_CLIENT_EMAIL,
    private_key: GCS_PRIVATE_KEY,
  },
});

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);