"use client";

import { useState } from "react";
import { checkVehicleStatus } from "@/lib/apiClient";
import type { PublicVehicleStatusResponse } from "@/types/api";
import ReportCaseForm from "./ReportCaseForm";
import styles from "./SearchForm.module.css";

export default function SearchForm() {
  const [vin, setVin] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PublicVehicleStatusResponse | null>(null);
  const [showReportCaseForm, setShowReportCaseForm] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setShowReportCaseForm(false);

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
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="vin" className={styles.label}>
            VIN
          </label>
          <input
            id="vin"
            type="text"
            className={styles.input}
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Enter VIN"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="engine_number" className={styles.label}>
            Engine Number
          </label>
          <input
            id="engine_number"
            type="text"
            className={styles.input}
            value={engineNumber}
            onChange={(e) => setEngineNumber(e.target.value)}
            placeholder="Enter engine number"
          />
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Checking..." : "Check Vehicle Status"}
        </button>
      </form>

      {error ? <div className={styles.error}>{error}</div> : null}

      {result ? (
        <div className={styles.result}>
          <h2 className={styles.resultTitle}>Search Result</h2>

          {!result.found ? (
            <p className={styles.infoText}>No vehicle record found.</p>
          ) : (
            <>
              <div className={styles.infoBlock}>
                <p className={styles.infoText}>
                  <strong>Status:</strong>{" "}
                  {result.has_verified_stolen_case
                    ? "Verified Stolen"
                    : result.latest_status || "No Record"}
                </p>

                {result.vehicle ? (
                  <>
                    <p className={styles.infoText}>
                      <strong>Make/Model:</strong> {result.vehicle.make}{" "}
                      {result.vehicle.model}
                    </p>
                    <p className={styles.infoText}>
                      <strong>Year:</strong> {result.vehicle.year ?? "N/A"}
                    </p>
                    <p className={styles.infoText}>
                      <strong>Color:</strong> {result.vehicle.color ?? "N/A"}
                    </p>
                    <p className={styles.infoText}>
                      <strong>Plate Number:</strong> {result.vehicle.plate_number}
                    </p>
                    <p className={styles.infoText}>
                      <strong>VIN:</strong> {result.vehicle.vin ?? "N/A"}
                    </p>
                    <p className={styles.infoText}>
                      <strong>Engine Number:</strong>{" "}
                      {result.vehicle.engine_number ?? "N/A"}
                    </p>
                  </>
                ) : null}

                {result.case_id ? (
                  <p className={styles.infoText}>
                    <strong>Case ID:</strong> {result.case_id}
                  </p>
                ) : null}

                {result.last_updated ? (
                  <p className={styles.infoText}>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(result.last_updated).toLocaleString()}
                  </p>
                ) : null}

                {result.police_station ? (
                  <p className={styles.infoText}>
                    <strong>Police Station:</strong> {result.police_station}
                  </p>
                ) : null}

                {result.description ? (
                  <p className={styles.infoText}>
                    <strong>Description:</strong> {result.description}
                  </p>
                ) : null}
              </div>

              {result.has_verified_stolen_case && result.case_id ? (
                <div className={styles.section}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      setShowReportCaseForm((prev) => !prev)
                    }
                  >
                    {showReportCaseForm
                      ? "Hide Sighting Form"
                      : "I found this vehicle"}
                  </button>

                  {showReportCaseForm ? (
                    <ReportCaseForm caseId={result.case_id} />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}