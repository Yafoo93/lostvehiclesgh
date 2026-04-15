"use client";

import { useState } from "react";
import { checkVehicleStatus } from "@/lib/apiClient";
import type { PublicVehicleStatusResponse } from "@/types/api";
import ReportCaseForm from "@/components/forms/ReportCaseForm";
import styles from "./HeroSearch.module.css";

type SearchMode = "vin" | "engine_number";

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
            mode === "vin"
              ? "Enter vehicle VIN"
              : "Enter vehicle engine number"
          }
        />

        <button type="submit" disabled={loading} className={styles.searchButton}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error ? <div className={styles.error}>{error}</div> : null}

      {result ? (
        <div className={styles.resultCard}>
          {!result.found ? (
            <p className={styles.resultText}>No vehicle record found.</p>
          ) : (
            <>
              <h2 className={styles.resultTitle}>Search Result</h2>

              <div className={styles.resultGrid}>
                <p className={styles.resultText}>
                  <strong>Status:</strong>{" "}
                  {result.has_verified_stolen_case
                    ? "Verified Stolen"
                    : result.latest_status || "No Record"}
                </p>

                {result.vehicle ? (
                  <>
                    <p className={styles.resultText}>
                      <strong>Vehicle:</strong> {result.vehicle.make}{" "}
                      {result.vehicle.model}
                    </p>
                    <p className={styles.resultText}>
                      <strong>Plate:</strong> {result.vehicle.plate_number}
                    </p>
                    <p className={styles.resultText}>
                      <strong>Year:</strong> {result.vehicle.year ?? "N/A"}
                    </p>
                    <p className={styles.resultText}>
                      <strong>Color:</strong> {result.vehicle.color ?? "N/A"}
                    </p>
                  </>
                ) : null}

                {result.description ? (
                  <p className={styles.resultText}>
                    <strong>Missing Note:</strong> {result.description}
                  </p>
                ) : null}
              </div>

              {result.has_verified_stolen_case && result.case_id ? (
                <div className={styles.reportArea}>
                  <button
                    type="button"
                    className={styles.reportButton}
                    onClick={() =>
                      setShowReportCaseForm((prev) => !prev)
                    }
                  >
                    {showReportCaseForm
                      ? "Hide Found Vehicle Form"
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