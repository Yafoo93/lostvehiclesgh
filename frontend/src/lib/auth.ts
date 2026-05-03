import { API_BASE_URL } from "./config";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
} from "@/types/api";

const ACCESS_TOKEN_KEY = "lostvehiclesgh_access_token";
const REFRESH_TOKEN_KEY = "lostvehiclesgh_refresh_token";

const FIELD_LABELS: Record<string, string> = {
  username: "Username",
  email: "Email",
  first_name: "First name",
  last_name: "Last name",
  phone: "Phone",
  password: "Password",
  password2: "Confirm password",
  non_field_errors: "Error",
  detail: "Error",
};

function formatErrorValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatErrorValue).filter(Boolean).join(" ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return formatValidationErrors(value);
  }

  return "";
}

function formatValidationErrors(data: unknown, fallback = "Request failed.") {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const messages = Object.entries(data).flatMap(([field, value]) => {
    const message = formatErrorValue(value);

    if (!message) {
      return [];
    }

    const label =
      FIELD_LABELS[field] ??
      field
        .replaceAll("_", " ")
        .replace(/^\w/, (letter) => letter.toUpperCase());

    return [`${label}: ${message}`];
  });

  return messages.length ? messages.join("\n") : fallback;
}

export function setTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    throw new Error("No refresh token found.");
  }

  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });

  const data: unknown = await response.json();

  if (
    !response.ok ||
    typeof data !== "object" ||
    data === null ||
    !("access" in data) ||
    typeof (data as { access?: unknown }).access !== "string"
  ) {
    clearTokens();
    throw new Error("Session expired. Please sign in again.");
  }

  const accessToken = (data as { access: string }).access;
  setTokens(accessToken, refreshToken);
  return accessToken;
}

function withAuthHeader(init: RequestInit = {}, accessToken: string): RequestInit {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  return {
    ...init,
    headers,
  };
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error("No access token found.");
  }

  const response = await fetch(input, withAuthHeader(init, accessToken));

  if (response.status !== 401) {
    return response;
  }

  const nextAccessToken = await refreshAccessToken();
  return fetch(input, withAuthHeader(init, nextAccessToken));
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(formatValidationErrors(data, "Registration failed."));
  }

  return data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed.");
  }

  setTokens(data.access, data.refresh);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await authenticatedFetch(`${API_BASE_URL}/auth/me/`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch current user.");
  }

  return data;
}

export async function logoutUser() {
  clearTokens();
}
