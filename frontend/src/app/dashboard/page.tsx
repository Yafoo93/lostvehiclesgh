"use client";

import { useEffect, useState } from "react";
import { fetchCaseSightings, fetchMyCases, fetchMyVehicles } from "@/lib/dashboard";
import type { CaseRecord, SightingRecord, VehicleRecord } from "@/types/api";
import styles from "./page.module.css";
import Link from "next/link";
import RecoveryRequestForm from "@/components/forms/RecoveryRequestForm";

type SightingsByCase = Record<number, SightingRecord[]>;

function getLatestCaseForVehicle(
  vehicleId: number,
  cases: CaseRecord[]
): CaseRecord | undefined {
  return cases.find((item) => item.vehicle === vehicleId);
}

function formatStatus(status?: CaseRecord["status"]) {
  if (!status) return "No case yet";

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

function toggleSightingsForCase(
  caseId: number,
  setExpandedSightings: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
) {
  setExpandedSightings((prev) => ({
    ...prev,
    [caseId]: !prev[caseId],
  }));
}

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [sightingsByCase, setSightingsByCase] = useState<SightingsByCase>({});
  const [openRecoveryCaseId, setOpenRecoveryCaseId] = useState<number | null>(null);
  const [expandedSightings, setExpandedSightings] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [vehicleData, caseData] = await Promise.all([
          fetchMyVehicles(),
          fetchMyCases(),
        ]);

        if (!isMounted) return;

        setVehicles(vehicleData);
        setCases(caseData);

        const sightingsEntries = await Promise.all(
          caseData.map(async (caseItem) => {
            const sightings = await fetchCaseSightings(caseItem.id);
            return [caseItem.id, sightings] as const;
          })
        );

        if (!isMounted) return;

        const sightingsMap: SightingsByCase = Object.fromEntries(sightingsEntries);
        setSightingsByCase(sightingsMap);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className={styles.page}>
        <h2 className={styles.title}>My Vehicles</h2>
        <p className={styles.text}>Loading your dashboard data...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.page}>
        <h2 className={styles.title}>My Vehicles</h2>
        <div className={styles.error}>{error}</div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.headerRow}>
        <div>
            <h2 className={styles.title}>My Vehicles</h2>
            <p className={styles.text}>
                View your listed vehicles, case status, and recent sighting reports.
            </p>
        </div>

        <Link href="/dashboard/vehicles/new" className={styles.addButton}>
            Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className={styles.emptyState}>
          You have not listed any vehicles yet.
        </div>
      ) : (
        <div className={styles.grid}>
          {vehicles.map((vehicle) => {
            const latestCase = getLatestCaseForVehicle(vehicle.id, cases);
            const sightings = latestCase ? sightingsByCase[latestCase.id] ?? [] : [];
            const latestSighting = sightings[0];
            const isExpanded = latestCase ? Boolean(expandedSightings[latestCase.id]) : false;


            return (
              <article key={vehicle.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <span className={styles.statusBadge}>
                    {formatStatus(latestCase?.status)}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.meta}>
                    <strong>Plate:</strong> {vehicle.plate_number || "N/A"}
                  </p>
                  <p className={styles.meta}>
                    <strong>VIN:</strong> {vehicle.vin || "N/A"}
                  </p>
                  <p className={styles.meta}>
                    <strong>Engine Number:</strong>{" "}
                    {vehicle.engine_number || "N/A"}
                  </p>
                  <p className={styles.meta}>
                    <strong>Year:</strong> {vehicle.year ?? "N/A"}
                  </p>
                  <p className={styles.meta}>
                    <strong>Color:</strong> {vehicle.color || "N/A"}
                  </p>

                {!latestCase ? (
                    <div className={styles.actionRow}>
                        <Link
                            href={`/dashboard/cases/new?vehicleId=${vehicle.id}`}
                            className={styles.reportButton}
                        >
                            Report Missing / Stolen
                        </Link>
                    </div>
                ) : null}


                  {latestCase ? (
                    <div className={styles.caseBox}>
                      <p className={styles.meta}>
                        <strong>Case ID:</strong> {latestCase.id}
                      </p>
                      <p className={styles.meta}>
                        <strong>Police Station:</strong> {latestCase.police_station}
                      </p>
                      <p className={styles.meta}>
                        <strong>Incident Date:</strong> {latestCase.incident_date}
                      </p>

                      {latestCase.description ? (
                        <p className={styles.description}>
                          <strong>Missing Note:</strong> {latestCase.description}
                        </p>
                      ) : null}

                      <div className={styles.sightingBox}>
                        <p className={styles.meta}>
                          <strong>Sighting Reports:</strong> {sightings.length}
                        </p>

                        {latestSighting ? (
                          <>
                            <p className={styles.meta}>
                              <strong>Latest Location:</strong> {latestSighting.location}
                            </p>
                            <p className={styles.meta}>
                              <strong>Latest Message:</strong> {latestSighting.message}
                            </p>
                            <p className={styles.meta}>
                              <strong>Reporter Name:</strong>{" "}
                              {latestSighting.reporter_name || "Not provided"}
                            </p>
                            <p className={styles.meta}>
                              <strong>Reporter Phone:</strong>{" "}
                              {latestSighting.reporter_phone || "Not provided"}
                            </p>
                            <p className={styles.meta}>
                              <strong>Reporter Email:</strong>{" "}
                              {latestSighting.reporter_email || "Not provided"}
                            </p>
                            <p className={styles.meta}>
                              <strong>Reported At:</strong>{" "}
                              {new Date(latestSighting.created_at).toLocaleString()}
                            </p>

                            {sightings.length > 1 ? (
                              <button
                                type="button"
                                className={styles.viewAllButton}
                                onClick={() =>
                                  latestCase &&
                                  toggleSightingsForCase(
                                    latestCase.id,
                                    setExpandedSightings
                                  )
                                }
                              >
                                {isExpanded
                                  ? "Hide all sighting reports"
                                  : "View all sighting reports"}
                              </button>
                            ) : null}

                            {isExpanded ? (
                              <div className={styles.sightingsList}>
                                {sightings.map((sighting) => (
                                  <div key={sighting.id} className={styles.sightingItem}>
                                    <p className={styles.meta}>
                                      <strong>Location:</strong> {sighting.location}
                                    </p>
                                    <p className={styles.meta}>
                                      <strong>Message:</strong> {sighting.message}
                                    </p>
                                    <p className={styles.meta}>
                                      <strong>Reporter Name:</strong>{" "}
                                      {sighting.reporter_name || "Not provided"}
                                    </p>
                                    <p className={styles.meta}>
                                      <strong>Reporter Phone:</strong>{" "}
                                      {sighting.reporter_phone || "Not provided"}
                                    </p>
                                    <p className={styles.meta}>
                                      <strong>Reporter Email:</strong>{" "}
                                      {sighting.reporter_email || "Not provided"}
                                    </p>
                                    <p className={styles.meta}>
                                      <strong>Reported At:</strong>{" "}
                                      {new Date(sighting.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <p className={styles.meta}>No sightings reported yet.</p>
                        )}
                      </div>

                      {latestCase.status === "VERIFIED_STOLEN" ? (
                        <div className={styles.recoverySection}>
                          {latestCase.recovery_requested_at ? (
                            <div className={styles.recoveryPendingNote}>
                              Recovery request submitted on{" "}
                              {new Date(latestCase.recovery_requested_at).toLocaleString()}. Awaiting
                              moderator confirmation.
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={styles.recoveredRequestButton}
                                onClick={() =>
                                  setOpenRecoveryCaseId((prev) =>
                                    prev === latestCase.id ? null : latestCase.id
                                  )
                                }
                              >
                                {openRecoveryCaseId === latestCase.id
                                  ? "Hide Recovery Form"
                                  : "Vehicle Recovered"}
                              </button>

                              {openRecoveryCaseId === latestCase.id ? (
                                <RecoveryRequestForm
                                  caseId={latestCase.id}
                                  onCancel={() => setOpenRecoveryCaseId(null)}
                                  onSubmitted={(submitted) => {
                                    setCases((prevCases) =>
                                      prevCases.map((caseItem) =>
                                        caseItem.id === latestCase.id
                                          ? {
                                              ...caseItem,
                                              recovery_requested_at: submitted.recovery_requested_at,
                                              recovery_date: submitted.recovery_date,
                                              recovery_location: submitted.recovery_location,
                                              recovery_circumstances: submitted.recovery_circumstances,
                                              recovery_vehicle_condition: submitted.recovery_vehicle_condition,
                                              recovery_additional_notes:
                                                submitted.recovery_additional_notes || null,
                                            }
                                          : caseItem
                                      )
                                    );
                                    setOpenRecoveryCaseId(null);
                                  }}
                                />
                              ) : null}
                            </>
                          )}
                        </div>
                      ) : null}

                    </div>
                  ) : (
                    <div className={styles.caseBox}>
                      <p className={styles.meta}>No case has been created yet.</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
