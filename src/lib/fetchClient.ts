export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function fetchClient<T = unknown>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, credentials: "include" });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* bodyなしは無視 */
    }
    throw new ApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}
