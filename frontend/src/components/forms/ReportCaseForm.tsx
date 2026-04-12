"use client";

import { useState } from "react";
import { reportSighting, revealContact } from "@/lib/apiClient";
import styles from "./ReportCaseForm.module.css";

type Props = {
  caseId: number;
};

export default function ReportCaseForm({ caseId }: Props) {
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const [sightingId, setSightingId] = useState<number | null>(null);
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  const [revealMessage, setRevealMessage] = useState("");
  const [revealError, setRevealError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setRevealError("");
    setRevealMessage("");
    setOwnerPhone(null);
    setSightingId(null);

    if (!location.trim() || !message.trim()) {
      setError("Location and message are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await reportSighting(caseId, {
        reporter_name: reporterName,
        reporter_phone: reporterPhone,
        reporter_email: reporterEmail,
        location,
        message,
      });

      setSuccessMessage(
        `${response.detail} Sighting ID: ${response.sighting_id}`
      );
      setSightingId(response.sighting_id);

      setReporterName("");
      setReporterPhone("");
      setReporterEmail("");
      setLocation("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevealContact() {
    if (!sightingId) return;

    setRevealError("");
    setRevealMessage("");
    setOwnerPhone(null);

    try {
      setRevealLoading(true);

      const response = await revealContact(caseId, sightingId);

      if (response.contact_shared && response.owner_phone) {
        setOwnerPhone(response.owner_phone);
        setRevealMessage("Owner contact revealed successfully.");
      } else {
        setRevealMessage("Owner has not enabled public contact yet.");
      }
    } catch (err) {
      setRevealError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRevealLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>I found this vehicle</h3>

      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="reporter_name" className={styles.label}>
            Your Name
          </label>
          <input
            id="reporter_name"
            type="text"
            className={styles.input}
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="reporter_phone" className={styles.label}>
            Your Phone
          </label>
          <input
            id="reporter_phone"
            type="text"
            className={styles.input}
            value={reporterPhone}
            onChange={(e) => setReporterPhone(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="reporter_email" className={styles.label}>
            Your Email
          </label>
          <input
            id="reporter_email"
            type="email"
            className={styles.input}
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="location" className={styles.label}>
            Location
          </label>
          <input
            id="location"
            type="text"
            className={styles.input}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did you see the vehicle?"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="message" className={styles.label}>
            Message
          </label>
          <textarea
            id="message"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Short details about the sighting"
            rows={4}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Submitting..." : "Submit Sighting Report"}
        </button>
      </form>

      {error ? (
        <p className={`${styles.message} ${styles.error}`}>{error}</p>
      ) : null}

      {successMessage ? (
        <p className={`${styles.message} ${styles.success}`}>
          {successMessage}
        </p>
      ) : null}

      {sightingId ? (
        <div className={styles.warningBox}>
          <p className={styles.warningText}>
            This contact is shared for recovery purposes only. Misuse may result
            in legal action.
          </p>

          <button
            type="button"
            onClick={handleRevealContact}
            disabled={revealLoading}
            className={styles.revealButton}
          >
            {revealLoading ? "Revealing..." : "Reveal Contact"}
          </button>
        </div>
      ) : null}

      {revealError ? (
        <p className={`${styles.message} ${styles.error}`}>{revealError}</p>
      ) : null}

      {revealMessage ? (
        <p className={`${styles.message} ${styles.success}`}>
          {revealMessage}
        </p>
      ) : null}

      {ownerPhone ? (
        <div className={styles.phoneBox}>
          <strong>Owner Phone:</strong> {ownerPhone}
        </div>
      ) : null}
    </div>
  );
}