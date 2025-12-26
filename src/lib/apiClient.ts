import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type JsonObject = Record<string, unknown>;

const getAuthHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiGet = async <T>(path: string): Promise<T> => {
  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeader()),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  const body = (await res.json().catch(() => null)) as JsonObject | null;

  if (!res.ok) {
    const message = (body?.message as string) || "Request failed";
    throw new ApiError(message, res.status);
  }

  return body as unknown as T;
};

export const apiPost = async <T>(path: string, data?: unknown): Promise<T> => {
  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeader()),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
  });

  const body = (await res.json().catch(() => null)) as JsonObject | null;

  if (!res.ok) {
    const message = (body?.message as string) || "Request failed";
    throw new ApiError(message, res.status);
  }

  return body as unknown as T;
};
