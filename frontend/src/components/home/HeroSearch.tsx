"use client";

import { useState } from "react";
import { checkVehicleStatus } from "@/lib/apiClient";
import type { PublicVehicleStatusResponse } from "@/types/api";
import ReportCaseForm from "@/components/forms/ReportCaseForm";
import styles from "./HeroSearch.module.css";

type SearchMode = "vin" | "engine_number";

function getStatusLabel(result: PublicVehicleStatusResponse) {
  if (!result.found) return "No record found";
  if (result.latest_status === "VERIFIED_STOLEN") return "Verified stolen";
  if (result.latest_status === "PENDING") return "Pending review";
  if (result.latest_status === "RECOVERED") return "Recovered";
  if (result.latest_status === "REJECTED") return "Rejected";
  return "Record found";
}

function getStatusClass(result: PublicVehicleStatusResponse) {
  if (!result.found) return styles.statusNeutral;
  if (result.latest_status === "VERIFIED_STOLEN") return styles.statusDanger;
  if (result.latest_status === "PENDING") return styles.statusWarning;
  if (result.latest_status === "RECOVERED") return styles.statusSuccess;
  return styles.statusNeutral;
}

export default function HeroSearch() {
  const [mode, setMode] = useState<SearchMode>("vin");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PublicVehicleStatusResponse | null>(null);
  const [showReportCaseForm, setShowReportCaseForm] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setShowReportCaseForm(false);

    if (!query.trim()) {
      setError(`Enter a ${mode === "vin" ? "VIN" : "engine number"}.`);
      return;
    }

    try {
      setLoading(true);

      const data = await checkVehicleStatus(
        mode === "vin"
          ? { vin: query.trim() }
          : { engine_number: query.trim() }
      );

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.modeSwitch}>
        <button
          type="button"
          className={mode === "vin" ? styles.activeMode : styles.modeButton}
          onClick={() => setMode("vin")}
        >
          Search by VIN
        </button>

        <button
          type="button"
          className={
            mode === "engine_number" ? styles.activeMode : styles.modeButton
          }
          onClick={() => setMode("engine_number")}
        >
          Search by Engine Number
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.searchShell}>
        <input
          type="text"
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            mode === "vin" ? "Enter vehicle VIN" : "Enter vehicle engine number"
          }
        />

        <button type="submit" disabled={loading} className={styles.searchButton}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error ? <div className={styles.error}>{error}</div> : null}

      {result ? (
        <div className={styles.resultCard}>
          <div className={styles.resultTop}>
            <h3 className={styles.resultTitle}>Search Result</h3>
            <span className={`${styles.statusBadge} ${getStatusClass(result)}`}>
              {getStatusLabel(result)}
            </span>
          </div>

          {!result.found ? (
            <p className={styles.resultText}>
              No vehicle record matched the details provided.
            </p>
          ) : (
            <>
              <div className={styles.resultGrid}>
                <p className={styles.resultText}>
                  <strong>Plate Number:</strong> {result.vehicle?.plate_number || "N/A"}
                </p>
                <p className={styles.resultText}>
                  <strong>Make:</strong> {result.vehicle?.make || "N/A"}
                </p>
                <p className={styles.resultText}>
                  <strong>Model:</strong> {result.vehicle?.model || "N/A"}
                </p>
                <p className={styles.resultText}>
                  <strong>Year:</strong> {result.vehicle?.year ?? "N/A"}
                </p>
                <p className={styles.resultText}>
                  <strong>Color:</strong> {result.vehicle?.color || "N/A"}
                </p>
                <p className={styles.resultText}>
                  <strong>Latest Status:</strong> {result.latest_status || "None"}
                </p>
              </div>

              {result.latest_status === "VERIFIED_STOLEN" && result.case_id ? (
                <div className={styles.reportArea}>
                  <div className={styles.alertBox}>
                    Warning: this vehicle has a verified stolen case.
                  </div>

                  <div className={styles.caseDetailsCard}>
                    <h3 className={styles.resultTitle}>Verified Case Details</h3>

                    <div className={styles.resultGrid}>
                      <p className={styles.resultText}>
                        <strong>Case ID:</strong> {result.case_id}
                      </p>

                      {result.reporter_name ? (
                        <p className={styles.resultText}>
                          <strong>Reported By:</strong> {result.reporter_name}
                        </p>
                      ) : null}

                      {result.police_station ? (
                        <p className={styles.resultText}>
                          <strong>Police Station:</strong> {result.police_station}
                        </p>
                      ) : null}

                      {result.reported_at ? (
                        <p className={styles.resultText}>
                          <strong>Reported On:</strong>{" "}
                          {new Date(result.reported_at).toLocaleString()}
                        </p>
                      ) : null}

                      {result.last_updated ? (
                        <p className={styles.resultText}>
                          <strong>Last Updated:</strong>{" "}
                          {new Date(result.last_updated).toLocaleString()}
                        </p>
                      ) : null}

                      {result.description ? (
                        <p className={styles.resultText}>
                          <strong>Brief Incident:</strong> {result.description}
                        </p>
                      ) : null}
                    </div>

                    <div className={styles.reportButtonRow}>
                      <button
                        type="button"
                        className={styles.reportButton}
                        onClick={() => setShowReportCaseForm((prev) => !prev)}
                      >
                        {showReportCaseForm ? "Hide Sighting Form" : "Report Sighting"}
                      </button>
                    </div>

                    {showReportCaseForm ? (
                      <ReportCaseForm caseId={result.case_id} />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}