import { API_BASE_URL } from "./config";
import { getAccessToken } from "./auth";
import type {
  CaseRecord,
  PaginatedResponse,
  SightingRecord,
  VehicleRecord,
} from "@/types/api";

function getAuthHeaders() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("No access token found.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function getErrorMessage(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    typeof (data as { detail?: unknown }).detail === "string"
  ) {
    return (data as { detail: string }).detail;
  }

  return fallback;
}

function isPaginatedResponse<T>(data: unknown): data is PaginatedResponse<T> {
  return (
    typeof data === "object" &&
    data !== null &&
    "results" in data &&
    Array.isArray((data as { results?: unknown }).results)
  );
}

function isSightingArray(data: unknown): data is SightingRecord[] {
  return Array.isArray(data);
}

export async function fetchMyVehicles(): Promise<VehicleRecord[]> {
  const response = await fetch(`${API_BASE_URL}/vehicles/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to fetch vehicles."));
  }

  if (!isPaginatedResponse<VehicleRecord>(data)) {
    throw new Error("Unexpected vehicles response format.");
  }

  return data.results;
}

export async function fetchMyCases(): Promise<CaseRecord[]> {
  const response = await fetch(`${API_BASE_URL}/cases/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to fetch cases."));
  }

  if (!isPaginatedResponse<CaseRecord>(data)) {
    throw new Error("Unexpected cases response format.");
  }

  return data.results;
}

export async function fetchCaseSightings(caseId: number): Promise<SightingRecord[]> {
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}/sightings/`, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to fetch sightings."));
  }

  if (!isSightingArray(data)) {
    throw new Error("Unexpected sightings response format.");
  }

  return data;
}

export async function createVehicle(payload: {
  plate_number: string;
  vin?: string;
  engine_number?: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/vehicles/`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to create vehicle."));
  }

  return data;
}

export async function createCase(payload: {
  vehicle_id: number;
  police_station: string;
  police_case_number: string;
  incident_date: string;
  last_seen_location_text?: string;
  description?: string;
  allow_public_contact?: boolean;
}) {
  const response = await fetch(`${API_BASE_URL}/cases/`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to create case."));
  }

  return data;
}