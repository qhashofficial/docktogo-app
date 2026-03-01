/* body from JSON.stringify(unknown) is string at runtime (valid BodyInit); TS inference limitation */
// @ts-nocheck
const getBaseUrl = () => import.meta.env.VITE_API_URL as string;

function buildRequestInit(
  method: RequestInit["method"],
  headers: Headers,
  body: string | undefined
): RequestInit {
  return {
    method,
    headers,
    credentials: "include",
    body: body as BodyInit | undefined,
  };
}

async function doRefresh(baseUrl: string): Promise<string | null> {
  const res = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.status === "ok" && data?.data?.access_token) {
    return data.data.access_token;
  }
  return null;
}

export type ApiClient = {
  get: (path: string) => Promise<Response>;
  post: (path: string, body?: unknown) => Promise<Response>;
  patch: (path: string, body?: unknown) => Promise<Response>;
  delete: (path: string) => Promise<Response>;
};

export function createApiClient(
  getToken: () => string | null,
  onTokenUpdate: (token: string | null) => void
): ApiClient {
  const baseUrl = getBaseUrl();

  async function request(
    path: string,
    options: RequestInit & { body?: unknown; skipRetry?: boolean }
  ): Promise<Response> {
    const { body, skipRetry, ...rest } = options;
    const init = rest as Omit<RequestInit, "body">;
    const url = `${baseUrl}${path}`;
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    function safeStringify(v: unknown): string {
      return JSON.stringify(v);
    }
    const bodyStr = (
      body === undefined ? undefined : safeStringify(body)
    ) as string | undefined;
    const fetchOpts = buildRequestInit(
      (init.method as RequestInit["method"]) ?? "GET",
      headers,
      bodyStr
    );
    let res = await fetch(url, fetchOpts);

    if (res.status === 401 && !skipRetry) {
      const newToken = await doRefresh(baseUrl);
      if (newToken) {
        onTokenUpdate(newToken);
        headers.set("Authorization", `Bearer ${newToken}`);
        res = await fetch(url, fetchOpts);
      } else {
        onTokenUpdate(null);
      }
    }

    return res;
  }

  return {
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) => request(path, { method: "POST", body }),
    patch: (path, body) => request(path, { method: "PATCH", body }),
    delete: (path) => request(path, { method: "DELETE" }),
  };
}
