"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth";
import {
  fetchCaseDocuments,
  fetchMyCases,
  fetchMyVehicles,
  markCaseRecovered,
  rejectCase,
  verifyCaseStolen,
  type CaseDocumentRecord,
} from "@/lib/dashboard";
import type { AuthUser, CaseRecord, VehicleRecord } from "@/types/api";
import styles from "./page.module.css";
import { API_BASE_URL } from "@/lib/config";

type StatusFilter = "ALL" | CaseRecord["status"];
type DocumentsByCase = Record<number, CaseDocumentRecord[]>;

function formatStatus(status: CaseRecord["status"]) {
  switch (status) {
    case "PENDING":
      return "Pending Review";
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

function getDocumentUrl(filePath: string) {
  if (!filePath) return "#";

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }

  const backendBase = API_BASE_URL.replace(/\/api$/, "");
  return `${backendBase}${filePath}`;
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

  const [user, setUser] = useState<AuthUser | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [vehiclesById, setVehiclesById] = useState<Record<number, VehicleRecord>>(
    {}
  );
  const [documentsByCase, setDocumentsByCase] = useState<DocumentsByCase>({});

  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  async function loadModerationData() {
    const currentUser = await fetchCurrentUser();

    if (currentUser.role !== "MODERATOR" && currentUser.role !== "ADMIN") {
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

    setUser(currentUser);
    setCases(caseData);
    setVehiclesById(mappedVehicles);
    setDocumentsByCase(mappedDocuments);
  }

  useEffect(() => {
    let isMounted = true;

    async function run() {
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
  }, [router]);

  const filteredCases = useMemo(() => {
    if (statusFilter === "ALL") return cases;
    return cases.filter((item) => item.status === statusFilter);
  }, [cases, statusFilter]);

  async function handleAction(
    caseId: number,
    action: "verify" | "reject" | "recover"
  ) {
    try {
      setActionLoadingKey(`${caseId}-${action}`);
      setError("");

      if (action === "verify") {
        await verifyCaseStolen(caseId);
      } else if (action === "reject") {
        await rejectCase(caseId);
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

  if (loading) {
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

      {filteredCases.length === 0 ? (
        <div className={styles.emptyState}>No cases found for this filter.</div>
      ) : (
        <div className={styles.grid}>
          {filteredCases.map((caseItem) => {
            const vehicle = vehiclesById[caseItem.vehicle];
            const documents = documentsByCase[caseItem.id] ?? [];

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
                      ? `${vehicle.plate_number} — ${vehicle.make} ${vehicle.model}`
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

                            <a
                                href={getDocumentUrl(doc.file)}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.openLink}
                            >
                                Open Attachment
                            </a>
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
                      caseItem.status === "VERIFIED_STOLEN"
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
                      caseItem.status === "REJECTED"
                    }
                    onClick={() => handleAction(caseItem.id, "reject")}
                  >
                    {actionLoadingKey === `${caseItem.id}-reject`
                      ? "Rejecting..."
                      : "Reject"}
                  </button>

                  <button
                    type="button"
                    className={styles.recoverButton}
                    disabled={
                      actionLoadingKey === `${caseItem.id}-recover` ||
                      caseItem.status === "RECOVERED"
                    }
                    onClick={() => handleAction(caseItem.id, "recover")}
                  >
                    {actionLoadingKey === `${caseItem.id}-recover`
                      ? "Updating..."
                      : "Mark Recovered"}
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