"use client";

import { useState } from "react";
import { checkVehicleStatus } from "@/lib/apiClient";
import type { PublicVehicleStatusResponse } from "@/types/api";

export default function SearchForm() {
  const [vin, setVin] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PublicVehicleStatusResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!vin.trim() && !engineNumber.trim()) {
      setError("Enter a VIN or engine number.");
      return;
    }

    try {
      setLoading(true);

      const data = await checkVehicleStatus({
        vin,
        engine_number: engineNumber,
      });

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="vin">VIN</label>
          <br />
          <input
            id="vin"
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Enter VIN"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="engine_number">Engine Number</label>
          <br />
          <input
            id="engine_number"
            type="text"
            value={engineNumber}
            onChange={(e) => setEngineNumber(e.target.value)}
            placeholder="Enter engine number"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check Vehicle Status"}
        </button>
      </form>

      {error ? (
        <div style={{ marginTop: "1rem", color: "crimson" }}>{error}</div>
      ) : null}

      {result ? (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>Search Result</h2>

          {!result.found ? (
            <p>No vehicle record found.</p>
          ) : (
            <>
              <p>
                <strong>Status:</strong>{" "}
                {result.has_verified_stolen_case
                  ? "Verified Stolen"
                  : result.latest_status || "No Record"}
              </p>

              {result.vehicle ? (
                <div>
                  <p>
                    <strong>Make/Model:</strong> {result.vehicle.make}{" "}
                    {result.vehicle.model}
                  </p>
                  <p>
                    <strong>Year:</strong> {result.vehicle.year ?? "N/A"}
                  </p>
                  <p>
                    <strong>Color:</strong> {result.vehicle.color ?? "N/A"}
                  </p>
                  <p>
                    <strong>Plate Number:</strong> {result.vehicle.plate_number}
                  </p>
                  <p>
                    <strong>VIN:</strong> {result.vehicle.vin ?? "N/A"}
                  </p>
                  <p>
                    <strong>Engine Number:</strong>{" "}
                    {result.vehicle.engine_number ?? "N/A"}
                  </p>
                </div>
              ) : null}

              {result.case_id ? (
                <p>
                  <strong>Case ID:</strong> {result.case_id}
                </p>
              ) : null}

              {result.last_updated ? (
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(result.last_updated).toLocaleString()}
                </p>
              ) : null}

              {result.police_station ? (
                <p>
                  <strong>Police Station:</strong> {result.police_station}
                </p>
              ) : null}

              {result.description ? (
                <p>
                  <strong>Description:</strong> {result.description}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}