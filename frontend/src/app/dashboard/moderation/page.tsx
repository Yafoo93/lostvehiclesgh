"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchCaseDocuments,
  fetchMyCases,
  fetchMyVehicles,
  markCaseRecovered,
  openCaseDocument,
  rejectCase,
  rejectRecovery,
  requestMoreInfo,
  setSuspiciousFlag,
  updateModeratorNotes,
  verifyCaseStolen,
  type CaseDocumentRecord,
} from "@/lib/dashboard";
import type { CaseRecord, VehicleRecord } from "@/types/api";
import styles from "./page.module.css";

type StatusFilter =
  | "ALL"
  | CaseRecord["status"]
  | "RECOVERY_SUBMITTED";

type DocumentsByCase = Record<number, CaseDocumentRecord[]>;
type ModerationDialogAction = "reject" | "more-info" | "notes" | "flag";

type ModerationDialog = {
  action: ModerationDialogAction;
  caseItem: CaseRecord;
};

function formatStatus(status: CaseRecord["status"]) {
  switch (status) {
    case "PENDING":
      return "Pending Review";
    case "NEEDS_INFO":
      return "More Info Requested";
    case "VERIFIED_STOLEN":
      return "Verified Stolen";
    case "REJECTED":
      return "Rejected";
    case "RECOVERED":
      return "Recovered";
    default:
      return status;
  }
}

function getDialogConfig(
  caseItem: CaseRecord,
  action: ModerationDialogAction
) {
  const hasRecoveryRequest =
    caseItem.status === "VERIFIED_STOLEN" &&
    caseItem.recovery_requested_at !== null;

  if (action === "reject") {
    return {
      title: hasRecoveryRequest ? "Reject Recovery Report" : "Reject Case",
      description: hasRecoveryRequest
        ? "Review the recovery details and record why this recovery report should not be approved."
        : "Review the case details and record why this missing vehicle report should be rejected.",
      label: hasRecoveryRequest ? "Recovery rejection reason" : "Case rejection reason",
      placeholder: "Write a clear reason that can be reviewed later.",
      confirmLabel: hasRecoveryRequest ? "Reject Recovery" : "Reject Case",
      required: true,
      minLength: 10,
      isRecoveryReject: hasRecoveryRequest,
      errorMessage: hasRecoveryRequest
        ? "Failed to reject recovery report."
        : "Failed to reject case.",
    };
  }

  if (action === "more-info") {
    return {
      title: "Request More Information",
      description: "Tell the owner exactly what information or evidence is needed before this case can move forward.",
      label: "Information requested from owner",
      placeholder: "Example: Upload a clearer police extract showing the case number.",
      confirmLabel: "Send Request",
      required: true,
      minLength: 10,
      isRecoveryReject: false,
      errorMessage: "Failed to request more information.",
    };
  }

  if (action === "notes") {
    return {
      title: "Moderator Notes",
      description: "Add or update internal notes for moderators and admins. These notes are not part of the public search result.",
      label: "Internal notes",
      placeholder: "Record internal review context, follow-up details, or risk notes.",
      confirmLabel: "Save Notes",
      required: false,
      minLength: 0,
      isRecoveryReject: false,
      errorMessage: "Failed to update moderator notes.",
    };
  }

  return {
    title: "Flag Suspicious Case",
    description: "Record why this case may involve fraud, inconsistent evidence, or suspicious reporting behavior.",
    label: "Suspicious/fraud flag reason",
    placeholder: "Explain the evidence or pattern that makes this case suspicious.",
    confirmLabel: "Flag Case",
    required: true,
    minLength: 10,
    isRecoveryReject: false,
    errorMessage: "Failed to update suspicious flag.",
  };
}

function formatDocType(docType: CaseDocumentRecord["doc_type"]) {
  switch (docType) {
    case "POLICE_EXTRACT":
      return "Police Extract";
    case "VEHICLE_PHOTO":
      return "Vehicle Photo";
    default:
      return docType;
  }
}

export default function ModerationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<number, VehicleRecord>>(
    {}
  );
  const [documentsByCase, setDocumentsByCase] = useState<DocumentsByCase>({});

  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dialog, setDialog] = useState<ModerationDialog | null>(null);
  const [dialogValue, setDialogValue] = useState("");
  const [dialogError, setDialogError] = useState("");

  async function loadModerationData() {
    if (!user) {
      return;
    }

    if (user.role !== "MODERATOR" && user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    const [caseData, vehicleData] = await Promise.all([
      fetchMyCases(),
      fetchMyVehicles(),
    ]);

    const mappedVehicles = Object.fromEntries(
      vehicleData.map((vehicle) => [vehicle.id, vehicle])
    );

    const documentEntries = await Promise.all(
      caseData.map(async (caseItem) => {
        const docs = await fetchCaseDocuments(caseItem.id);
        return [caseItem.id, docs] as const;
      })
    );

    const mappedDocuments: DocumentsByCase = Object.fromEntries(documentEntries);

    setCases(caseData);
    setVehiclesById(mappedVehicles);
    setDocumentsByCase(mappedDocuments);
  }

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (authLoading) {
        return;
      }

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        if (!isMounted) return;
        await loadModerationData();
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load moderation data."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [authLoading, router, user]);

  const filteredCases = useMemo(() => {
    if (statusFilter === "ALL") {
      return cases;
    }

    if (statusFilter === "RECOVERY_SUBMITTED") {
      return cases.filter(
        (item) =>
          item.status === "VERIFIED_STOLEN" &&
          item.recovery_requested_at !== null
      );
    }

    return cases.filter((item) => item.status === statusFilter);
  }, [cases, statusFilter]);

  const dialogVehicle = dialog ? vehiclesById[dialog.caseItem.vehicle] : null;
  const dialogConfig = dialog ? getDialogConfig(dialog.caseItem, dialog.action) : null;

  function openDialog(caseItem: CaseRecord, action: ModerationDialogAction) {
    setDialog({ caseItem, action });
    setDialogError("");
    setError("");
    setDialogValue(action === "notes" ? caseItem.moderator_notes || "" : "");
  }

  function closeDialog() {
    if (actionLoadingKey) return;
    setDialog(null);
    setDialogValue("");
    setDialogError("");
  }

  async function handleAction(
    caseId: number,
    action: "verify" | "recover"
  ) {
    try {
      setActionLoadingKey(`${caseId}-${action}`);
      setError("");

      if (action === "verify") {
        await verifyCaseStolen(caseId);
      } else {
        await markCaseRecovered(caseId);
      }

      await loadModerationData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update case status."
      );
    } finally {
      setActionLoadingKey("");
    }
  }

  async function handleDialogSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dialog || !dialogConfig) return;

    const value = dialogValue.trim();

    if (dialogConfig.required && value.length < dialogConfig.minLength) {
      setDialogError(
        `Enter at least ${dialogConfig.minLength} characters before confirming.`
      );
      return;
    }

    try {
      setActionLoadingKey(`${dialog.caseItem.id}-${dialog.action}`);
      setError("");

      if (dialog.action === "reject") {
        if (dialogConfig.isRecoveryReject) {
          await rejectRecovery(dialog.caseItem.id, value);
        } else {
          await rejectCase(dialog.caseItem.id, value);
        }
      } else if (dialog.action === "more-info") {
        await requestMoreInfo(dialog.caseItem.id, value);
      } else if (dialog.action === "notes") {
        await updateModeratorNotes(dialog.caseItem.id, dialogValue);
      } else if (dialog.action === "flag") {
        await setSuspiciousFlag(dialog.caseItem.id, true, value);
      }

      await loadModerationData();
      closeDialog();
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : dialogConfig.errorMessage);
    } finally {
      setActionLoadingKey("");
    }
  }

  async function handleSuspiciousFlag(caseItem: CaseRecord) {
    const nextFlag = !caseItem.suspicious_flag;

    if (nextFlag) {
      openDialog(caseItem, "flag");
      return;
    }

    try {
      setActionLoadingKey(`${caseItem.id}-flag`);
      setError("");
      await setSuspiciousFlag(caseItem.id, nextFlag, "");
      await loadModerationData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update suspicious flag."
      );
    } finally {
      setActionLoadingKey("");
    }
  }

  async function handleOpenDocument(document: CaseDocumentRecord) {
    try {
      setActionLoadingKey(`document-${document.id}`);
      setError("");
      await openCaseDocument(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open document.");
    } finally {
      setActionLoadingKey("");
    }
  }

  if (authLoading || loading) {
    return (
      <section className={styles.page}>
        <h2 className={styles.title}>Moderation Dashboard</h2>
        <p className={styles.text}>Loading moderation data...</p>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Moderation Dashboard</h2>
          <p className={styles.text}>
            Review and update case statuses as a {user.role.toLowerCase()}.
          </p>
        </div>
      </div>

      <div className={styles.filterRow}>
        <button
          type="button"
          className={statusFilter === "ALL" ? styles.activeFilter : styles.filterButton}
          onClick={() => setStatusFilter("ALL")}
        >
          All
        </button>
        <button
          type="button"
          className={statusFilter === "PENDING" ? styles.activeFilter : styles.filterButton}
          onClick={() => setStatusFilter("PENDING")}
        >
          Pending
        </button>
        <button
          type="button"
          className={
            statusFilter === "VERIFIED_STOLEN" ? styles.activeFilter : styles.filterButton
          }
          onClick={() => setStatusFilter("VERIFIED_STOLEN")}
        >
          Verified
        </button>
        <button
          type="button"
          className={
            statusFilter === "NEEDS_INFO" ? styles.activeFilter : styles.filterButton
          }
          onClick={() => setStatusFilter("NEEDS_INFO")}
        >
          Needs Info
        </button>
        <button
          type="button"
          className={
            statusFilter === "RECOVERY_SUBMITTED"
              ? styles.activeFilter
              : styles.filterButton
          }
          onClick={() => setStatusFilter("RECOVERY_SUBMITTED")}
        >
          Recovery Submitted
        </button>
        <button
          type="button"
          className={statusFilter === "REJECTED" ? styles.activeFilter : styles.filterButton}
          onClick={() => setStatusFilter("REJECTED")}
        >
          Rejected
        </button>
        <button
          type="button"
          className={statusFilter === "RECOVERED" ? styles.activeFilter : styles.filterButton}
          onClick={() => setStatusFilter("RECOVERED")}
        >
          Recovered
        </button>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      {dialog && dialogConfig ? (
        <div className={styles.modalOverlay} role="presentation">
          <form
            className={styles.modal}
            onSubmit={handleDialogSubmit}
            aria-labelledby="moderation-dialog-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="moderation-dialog-title" className={styles.modalTitle}>
                  {dialogConfig.title}
                </h3>
                <p className={styles.modalText}>{dialogConfig.description}</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeDialog}
                aria-label="Close moderation dialog"
                disabled={Boolean(actionLoadingKey)}
              >
                X
              </button>
            </div>

            <div className={styles.caseSummary}>
              <p className={styles.meta}>
                <strong>Case:</strong> #{dialog.caseItem.id}
              </p>
              <p className={styles.meta}>
                <strong>Status:</strong> {formatStatus(dialog.caseItem.status)}
              </p>
              <p className={styles.meta}>
                <strong>Vehicle:</strong>{" "}
                {dialogVehicle
                  ? `${dialogVehicle.vin} - ${dialogVehicle.make} ${dialogVehicle.model}`
                  : `Vehicle ID ${dialog.caseItem.vehicle}`}
              </p>
              <p className={styles.meta}>
                <strong>Police Case:</strong>{" "}
                {dialog.caseItem.police_case_number}
              </p>
            </div>

            <label htmlFor="moderation-dialog-value" className={styles.label}>
              {dialogConfig.label}
            </label>
            <textarea
              id="moderation-dialog-value"
              className={styles.textarea}
              value={dialogValue}
              onChange={(event) => {
                setDialogValue(event.target.value);
                setDialogError("");
              }}
              rows={6}
              maxLength={1200}
              placeholder={dialogConfig.placeholder}
            />

            {dialogError ? (
              <div className={styles.dialogError}>{dialogError}</div>
            ) : null}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeDialog}
                disabled={Boolean(actionLoadingKey)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.confirmButton}
                disabled={Boolean(actionLoadingKey)}
              >
                {actionLoadingKey === `${dialog.caseItem.id}-${dialog.action}`
                  ? "Saving..."
                  : dialogConfig.confirmLabel}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {filteredCases.length === 0 ? (
        <div className={styles.emptyState}>No cases found for this filter.</div>
      ) : (
        <div className={styles.grid}>
          {filteredCases.map((caseItem) => {
            const vehicle = vehiclesById[caseItem.vehicle];
            const documents = documentsByCase[caseItem.id] ?? [];
            const hasRecoveryRequest =
              caseItem.status === "VERIFIED_STOLEN" &&
              caseItem.recovery_requested_at !== null;
            const isRecovered = caseItem.status === "RECOVERED";

            return (
              <article key={caseItem.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <h3 className={styles.cardTitle}>Case #{caseItem.id}</h3>
                    <p className={styles.meta}>
                      <strong>Status:</strong> {formatStatus(caseItem.status)}
                    </p>
                  </div>

                  <span className={styles.statusBadge}>
                    {formatStatus(caseItem.status)}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.meta}>
                    <strong>Vehicle:</strong>{" "}
                    {vehicle
                      ? `${vehicle.vin} - ${vehicle.make} ${vehicle.model}`
                      : `Vehicle ID ${caseItem.vehicle}`}
                  </p>
                  <p className={styles.meta}>
                    <strong>Police Station:</strong> {caseItem.police_station}
                  </p>
                  <p className={styles.meta}>
                    <strong>Police Case Number:</strong> {caseItem.police_case_number}
                  </p>
                  <p className={styles.meta}>
                    <strong>Incident Date:</strong> {caseItem.incident_date}
                  </p>
                  {caseItem.last_seen_location_text ? (
                    <p className={styles.meta}>
                      <strong>Last Seen:</strong> {caseItem.last_seen_location_text}
                    </p>
                  ) : null}
                  {caseItem.description ? (
                    <p className={styles.description}>
                      <strong>Missing Note:</strong> {caseItem.description}
                    </p>
                  ) : null}

                  <div className={styles.moderationBox}>
                    <p className={styles.meta}>
                      <strong>Suspicious/Fraud Flag:</strong>{" "}
                      {caseItem.suspicious_flag ? "Flagged" : "Not flagged"}
                    </p>

                    {caseItem.suspicious_flag_reason ? (
                      <p className={styles.meta}>
                        <strong>Flag Reason:</strong>{" "}
                        {caseItem.suspicious_flag_reason}
                      </p>
                    ) : null}

                    {caseItem.rejection_reason ? (
                      <p className={styles.meta}>
                        <strong>Rejection Reason:</strong>{" "}
                        {caseItem.rejection_reason}
                      </p>
                    ) : null}

                    {caseItem.more_info_request_note ? (
                      <p className={styles.meta}>
                        <strong>More Info Request:</strong>{" "}
                        {caseItem.more_info_request_note}
                      </p>
                    ) : null}

                    {caseItem.moderator_notes ? (
                      <p className={styles.meta}>
                        <strong>Moderator Notes:</strong>{" "}
                        {caseItem.moderator_notes}
                      </p>
                    ) : null}
                  </div>

                  {hasRecoveryRequest ? (
                    <div className={styles.recoveryBox}>
                      <h4 className={styles.recoveryTitle}>Recovery Report Submitted</h4>

                      <p className={styles.meta}>
                        <strong>Submitted At:</strong>{" "}
                        {caseItem.recovery_requested_at
                          ? new Date(caseItem.recovery_requested_at).toLocaleString()
                          : "N/A"}
                      </p>

                      <p className={styles.meta}>
                        <strong>Recovery Date:</strong>{" "}
                        {caseItem.recovery_date || "N/A"}
                      </p>

                      <p className={styles.meta}>
                        <strong>Recovery Location:</strong>{" "}
                        {caseItem.recovery_location || "N/A"}
                      </p>

                      <p className={styles.meta}>
                        <strong>Circumstances:</strong>{" "}
                        {caseItem.recovery_circumstances || "N/A"}
                      </p>

                      <p className={styles.meta}>
                        <strong>Vehicle Condition:</strong>{" "}
                        {caseItem.recovery_vehicle_condition || "N/A"}
                      </p>

                      <p className={styles.meta}>
                        <strong>Additional Notes:</strong>{" "}
                        {caseItem.recovery_additional_notes || "None provided"}
                      </p>
                    </div>
                  ) : null}

                  <div className={styles.documentsBox}>
                    <p className={styles.meta}>
                      <strong>Attachments:</strong> {documents.length}
                    </p>

                    {documents.length === 0 ? (
                      <p className={styles.meta}>No attachments uploaded yet.</p>
                    ) : (
                      <div className={styles.documentsList}>
                        {documents.map((doc) => (
                          <div key={doc.id} className={styles.documentItem}>
                            <p className={styles.meta}>
                              <strong>Type:</strong> {formatDocType(doc.doc_type)}
                            </p>
                            <p className={styles.meta}>
                              <strong>Filename:</strong> {doc.original_filename || "N/A"}
                            </p>
                            <p className={styles.meta}>
                              <strong>Uploaded:</strong>{" "}
                              {new Date(doc.created_at).toLocaleString()}
                            </p>

                            <button
                              type="button"
                              className={styles.openLink}
                              onClick={() => handleOpenDocument(doc)}
                              disabled={actionLoadingKey === `document-${doc.id}`}
                            >
                              {actionLoadingKey === `document-${doc.id}`
                                ? "Opening..."
                                : "Open Attachment"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.verifyButton}
                    disabled={
                      actionLoadingKey === `${caseItem.id}-verify` ||
                      caseItem.status === "VERIFIED_STOLEN" ||
                      isRecovered
                    }
                    onClick={() => handleAction(caseItem.id, "verify")}
                  >
                    {actionLoadingKey === `${caseItem.id}-verify`
                      ? "Verifying..."
                      : "Verify Stolen"}
                  </button>

                  <button
                    type="button"
                    className={styles.rejectButton}
                    disabled={
                      actionLoadingKey === `${caseItem.id}-reject` ||
                      caseItem.status === "REJECTED" ||
                      isRecovered
                    }
                    onClick={() => openDialog(caseItem, "reject")}
                  >
                    {actionLoadingKey === `${caseItem.id}-reject`
                      ? "Rejecting..."
                      : hasRecoveryRequest
                      ? "Reject Recovery"
                      : "Reject"}
                  </button>

                  <button
                    type="button"
                    className={styles.recoverButton}
                    disabled={
                      actionLoadingKey === `${caseItem.id}-recover` ||
                      isRecovered ||
                      !hasRecoveryRequest
                    }
                    onClick={() => handleAction(caseItem.id, "recover")}
                  >
                    {actionLoadingKey === `${caseItem.id}-recover`
                      ? "Updating..."
                      : "Approve Recovery"}
                  </button>

                  <button
                    type="button"
                    className={styles.infoButton}
                    disabled={
                      actionLoadingKey === `${caseItem.id}-more-info` ||
                      caseItem.status === "REJECTED" ||
                      isRecovered
                    }
                    onClick={() => openDialog(caseItem, "more-info")}
                  >
                    {actionLoadingKey === `${caseItem.id}-more-info`
                      ? "Requesting..."
                      : "Request More Info"}
                  </button>

                  <button
                    type="button"
                    className={styles.notesButton}
                    disabled={actionLoadingKey === `${caseItem.id}-notes`}
                    onClick={() => openDialog(caseItem, "notes")}
                  >
                    {actionLoadingKey === `${caseItem.id}-notes`
                      ? "Saving..."
                      : "Moderator Notes"}
                  </button>

                  <button
                    type="button"
                    className={
                      caseItem.suspicious_flag
                        ? styles.clearFlagButton
                        : styles.flagButton
                    }
                    disabled={actionLoadingKey === `${caseItem.id}-flag`}
                    onClick={() => handleSuspiciousFlag(caseItem)}
                  >
                    {actionLoadingKey === `${caseItem.id}-flag`
                      ? "Updating..."
                      : caseItem.suspicious_flag
                      ? "Clear Fraud Flag"
                      : "Flag Suspicious"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
