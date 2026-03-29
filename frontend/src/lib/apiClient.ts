import { API_BASE_URL } from "./config";
import type { PublicVehicleStatusResponse } from "@/types/api";

type VehicleSearchParams = {
  vin?: string;
  engine_number?: string;
};

export async function checkVehicleStatus(
  params: VehicleSearchParams
): Promise<PublicVehicleStatusResponse> {
  const url = new URL(`${API_BASE_URL}/check-vehicle/`);

  if (params.vin?.trim()) {
    url.searchParams.set("vin", params.vin.trim());
  }

  if (params.engine_number?.trim()) {
    url.searchParams.set("engine_number", params.engine_number.trim());
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to check vehicle status.");
  }

  return data;
}