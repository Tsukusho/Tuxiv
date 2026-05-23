import { z } from "zod";

const EnvSchema = z.object({
  JWT_SECRET: z.string().min(1),
  SHARED_PASSWORD: z.string().min(1),
  MONGODB_URI: z.string().url(),
  GCS_PROJECT_ID: z.string().min(1),
  GCS_CLIENT_EMAIL: z.string().min(1),
  GCS_PRIVATE_KEY: z
    .string()
    .min(1)
    .transform((v) => v.replace(/\\n/g, "\n")),
  GCS_BUCKET_NAME: z.string().min(1),
});

export const env = EnvSchema.parse(process.env);
