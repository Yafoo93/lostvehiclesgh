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

export type ReportSightingPayload = {
  reporter_name?: string;
  reporter_phone?: string;
  reporter_email?: string;
  message: string;
  location: string;
};

export type ReportSightingResponse = {
  detail: string;
  sighting_id: number;
  owner_phone: string | null;
  contact_shared: boolean;
};

export type RevealContactResponse = {
  detail: string;
  owner_phone: string | null;
  contact_shared: boolean;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "OWNER" | "MODERATOR" | "ADMIN" | "PARTNER";
};

export type RegisterPayload = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  password2: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type VehicleRecord = {
  id: number;
  owner: number;
  plate_number: string;
  vin: string | null;
  engine_number: string | null;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseRecord = {
  id: number;
  vehicle: number;
  reporter: number;
  status: "PENDING" | "VERIFIED_STOLEN" | "REJECTED" | "RECOVERED";
  police_station: string;
  police_case_number: string;
  incident_date: string;
  last_seen_location_text: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  allow_public_contact: boolean;
};

export type SightingRecord = {
  id: number;
  reporter_name: string;
  reporter_phone: string;
  reporter_email: string;
  message: string;
  location: string;
  contact_revealed: boolean;
  contact_revealed_at: string | null;
  created_at: string;
};