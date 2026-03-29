export type VehicleSummary = {
  plate_number: string;
  vin: string | null;
  engine_number: string | null;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
};

export type PublicVehicleStatusResponse = {
  found: boolean;
  has_verified_stolen_case: boolean;
  latest_status: string | null;
  case_id: number | null;
  last_updated: string | null;
  police_station: string | null;
  description: string | null;
  vehicle: VehicleSummary | null;
};