import { z } from "zod";

const EnvSchema = z.object({
  JWT_SECRET: z.string().min(1),
  SHARED_PASSWORD: z.string().min(1),
  MONGODB_URI: z.string().url(),
});

export const env = EnvSchema.parse(process.env);
