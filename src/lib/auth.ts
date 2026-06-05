import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";

const jwtSchema = z.object({ id: z.string() });

export async function getAuthenticatedUserId(): Promise<string | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const result = jwtSchema.safeParse(decoded);
    if (!result.success) return null;
    return result.data.id;
  } catch {
    return null;
  }
}
