"use client";

import { useState } from "react";
import { checkVehicleStatus } from "@/lib/apiClient";
import type { PublicVehicleStatusResponse } from "@/types/api";
import ReportCaseForm from "./ReportCaseForm";
import styles from "./SearchForm.module.css";

function getStatusLabel(result: PublicVehicleStatusResponse): string {
  switch (result.latest_status) {
    case "VERIFIED_STOLEN":
      return "Verified Stolen";
    case "RECOVERED":
      return "Recovered";
    case "REJECTED":
      return "Rejected";
    case "PENDING":
      return "Pending Review";
    default:
      return "No Record";
  }
}

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
                  <strong>Status:</strong> {getStatusLabel(result)}
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
              </div>

              {result.latest_status === "VERIFIED_STOLEN" && result.case_id ? (
                <div className={styles.section}>
                  <h3 className={styles.resultTitle}>Verified Case Details</h3>

                  <div className={styles.infoBlock}>
                    <p className={styles.infoText}>
                      <strong>Case ID:</strong> {result.case_id}
                    </p>

                    {result.reporter_name ? (
                      <p className={styles.infoText}>
                        <strong>Reported By:</strong> {result.reporter_name}
                      </p>
                    ) : null}

                    {result.police_station ? (
                      <p className={styles.infoText}>
                        <strong>Police Station:</strong> {result.police_station}
                      </p>
                    ) : null}

                    {result.reported_at ? (
                      <p className={styles.infoText}>
                        <strong>Reported On:</strong>{" "}
                        {new Date(result.reported_at).toLocaleString()}
                      </p>
                    ) : null}

                    {result.last_updated ? (
                      <p className={styles.infoText}>
                        <strong>Last Updated:</strong>{" "}
                        {new Date(result.last_updated).toLocaleString()}
                      </p>
                    ) : null}

                    {result.description ? (
                      <p className={styles.infoText}>
                        <strong>Brief Incident:</strong> {result.description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setShowReportCaseForm((prev) => !prev)}
                  >
                    {showReportCaseForm ? "Hide Sighting Form" : "Report Sighting"}
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