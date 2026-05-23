import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { z } from "zod";

const JWT_SECRET: string =
  process.env.JWT_SECRET ??
  (() => {
    throw new Error("JWT_SECRET is required");
  })();

const jwtSchema = z.object({ id: z.string() });

export async function getAuthenticatedUserId(): Promise<string | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = jwtSchema.safeParse(decoded);
    if (!result.success) return null;
    return result.data.id;
  } catch {
    return null;
  }
}
