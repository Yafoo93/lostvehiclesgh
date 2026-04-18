"use client";

import { useState } from "react";
import { requestCaseRecovery } from "@/lib/dashboard";
import type { RecoveryRequestPayload } from "@/types/api";
import styles from "./RecoveryRequestForm.module.css";

type Props = {
  caseId: number;
  onCancel?: () => void;
  onSubmitted?: (payload: RecoveryRequestPayload & { recovery_requested_at: string }) => void;
};

export default function RecoveryRequestForm({
  caseId,
  onCancel,
  onSubmitted,
}: Props) {
  const [recoveryDate, setRecoveryDate] = useState("");
  const [recoveryLocation, setRecoveryLocation] = useState("");
  const [recoveryCircumstances, setRecoveryCircumstances] = useState("");
  const [recoveryVehicleCondition, setRecoveryVehicleCondition] = useState("");
  const [recoveryAdditionalNotes, setRecoveryAdditionalNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (
      !recoveryDate.trim() ||
      !recoveryLocation.trim() ||
      !recoveryCircumstances.trim() ||
      !recoveryVehicleCondition.trim()
    ) {
      setError("Recovery date, location, circumstances, and vehicle condition are required.");
      return;
    }

    const payload: RecoveryRequestPayload = {
      recovery_date: recoveryDate,
      recovery_location: recoveryLocation.trim(),
      recovery_circumstances: recoveryCircumstances.trim(),
      recovery_vehicle_condition: recoveryVehicleCondition.trim(),
      recovery_additional_notes: recoveryAdditionalNotes.trim(),
    };

    try {
      setLoading(true);

      const response = await requestCaseRecovery(caseId, payload);

      setSuccessMessage(response.detail);

      onSubmitted?.({
        ...payload,
        recovery_requested_at: response.recovery_requested_at,
      });

      setRecoveryDate("");
      setRecoveryLocation("");
      setRecoveryCircumstances("");
      setRecoveryVehicleCondition("");
      setRecoveryAdditionalNotes("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit recovery request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Recovered Vehicle Report</h3>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="recovery_date" className={styles.label}>
            Date of Recovery
          </label>
          <input
            id="recovery_date"
            type="date"
            className={styles.input}
            value={recoveryDate}
            onChange={(e) => setRecoveryDate(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="recovery_location" className={styles.label}>
            Where It Was Recovered
          </label>
          <input
            id="recovery_location"
            type="text"
            className={styles.input}
            value={recoveryLocation}
            onChange={(e) => setRecoveryLocation(e.target.value)}
            placeholder="Enter recovery location"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="recovery_circumstances" className={styles.label}>
            Circumstances Leading to Recovery
          </label>
          <textarea
            id="recovery_circumstances"
            className={styles.textarea}
            value={recoveryCircumstances}
            onChange={(e) => setRecoveryCircumstances(e.target.value)}
            rows={4}
            placeholder="Describe how the vehicle was recovered"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="recovery_vehicle_condition" className={styles.label}>
            State It Was Found
          </label>
          <textarea
            id="recovery_vehicle_condition"
            className={styles.textarea}
            value={recoveryVehicleCondition}
            onChange={(e) => setRecoveryVehicleCondition(e.target.value)}
            rows={3}
            placeholder="Describe the vehicle condition when found"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="recovery_additional_notes" className={styles.label}>
            Other Relevant Information
          </label>
          <textarea
            id="recovery_additional_notes"
            className={styles.textarea}
            value={recoveryAdditionalNotes}
            onChange={(e) => setRecoveryAdditionalNotes(e.target.value)}
            rows={3}
            placeholder="Optional extra details"
          />
        </div>

        {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}
        {successMessage ? (
          <p className={`${styles.message} ${styles.success}`}>{successMessage}</p>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "Submitting..." : "Submit Recovery Request"}
          </button>

          {onCancel ? (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}