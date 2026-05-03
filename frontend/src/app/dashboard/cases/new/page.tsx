"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createCase, fetchMyVehicles, uploadCaseDocument } from "@/lib/dashboard";
import type { VehicleRecord } from "@/types/api";
import styles from "./page.module.css";

function NewCaseFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [vehicleId, setVehicleId] = useState(searchParams.get("vehicleId") ?? "");
  const [policeStation, setPoliceStation] = useState("");
  const [policeCaseNumber, setPoliceCaseNumber] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [description, setDescription] = useState("");
  const [allowPublicContact, setAllowPublicContact] = useState(false);
  const [policeExtractFile, setPoliceExtractFile] = useState<File | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  

  useEffect(() => {
    let isMounted = true;

    async function loadVehicles() {
      try {
        const data = await fetchMyVehicles();
        if (!isMounted) return;
        setVehicles(data);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load vehicles."
        );
      } finally {
        if (isMounted) {
          setLoadingVehicles(false);
        }
      }
    }

    loadVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!vehicleId || !policeStation.trim() || !policeCaseNumber.trim() || !incidentDate) {
      setError("Vehicle, police station, police case number, and incident date are required.");
      return;
    }

    if (!policeExtractFile) {
      setError("Police extract is required for case submission.");
      return;
    }

    try {
      setLoading(true);

      const createdCase = await createCase({
        vehicle_id: Number(vehicleId),
        police_station: policeStation.trim(),
        police_case_number: policeCaseNumber.trim(),
        incident_date: incidentDate,
        last_seen_location_text: lastSeenLocation.trim() || undefined,
        description: description.trim() || undefined,
        allow_public_contact: allowPublicContact,
      });

      await uploadCaseDocument({
        caseId: createdCase.id,
        docType: "POLICE_EXTRACT",
        file: policeExtractFile,
      });

      for (const photo of vehiclePhotos) {
        await uploadCaseDocument({
          caseId: createdCase.id,
          docType: "VEHICLE_PHOTO",
          file: photo,
        });
      }

      setSuccessMessage(
        "Case submitted successfully with police extract and any selected vehicle pictures. Redirecting to dashboard..."
      );
      setVehiclePhotos([]);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create case.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.title}>Report Missing / Stolen Vehicle</h2>
      <p className={styles.text}>
        Create a case for one of your vehicles and upload the police extract.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="vehicle_id" className={styles.label}>
            Vehicle
          </label>
          <select
            id="vehicle_id"
            className={styles.select}
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            disabled={loadingVehicles}
          >
            <option value="">Select a vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.vin} — {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="police_station" className={styles.label}>
              Police Station
            </label>
            <input
              id="police_station"
              className={styles.input}
              value={policeStation}
              onChange={(e) => setPoliceStation(e.target.value)}
              placeholder="Enter police station"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="police_case_number" className={styles.label}>
              Police Case Number
            </label>
            <input
              id="police_case_number"
              className={styles.input}
              value={policeCaseNumber}
              onChange={(e) => setPoliceCaseNumber(e.target.value)}
              placeholder="Enter police case number"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="incident_date" className={styles.label}>
              Incident Date
            </label>
            <input
              id="incident_date"
              type="date"
              className={styles.input}
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="last_seen_location" className={styles.label}>
              Last Seen Location
            </label>
            <input
              id="last_seen_location"
              className={styles.input}
              value={lastSeenLocation}
              onChange={(e) => setLastSeenLocation(e.target.value)}
              placeholder="Optional location"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="description" className={styles.label}>
            Description / Missing Note
          </label>
          <textarea
            id="description"
            rows={5}
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe how the vehicle went missing"
          />
        </div>
      <div className={styles.uploadRow}>
        <div className={styles.field}>
          <label htmlFor="police_extract" className={styles.label}>
            Police Extract
          </label>
          <input
            id="police_extract"
            type="file"
            className={styles.fileInput}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setPoliceExtractFile(e.target.files?.[0] || null)}
          />
          <p className={styles.helperText}>
            Upload the official police extract as PDF, JPG, or PNG.
          </p>
        </div>

        <div className={styles.field}>
          <label htmlFor="vehicle_photos" className={styles.label}>
            Vehicle Pictures (Optional)
          </label>
          <input
            id="vehicle_photos"
            type="file"
            className={styles.fileInput}
            accept=".jpg,.jpeg,.png"
            multiple
            onChange={(e) =>
              setVehiclePhotos(e.target.files ? Array.from(e.target.files) : [])
            }
          />
          <p className={styles.helperText}>
            Optional: upload clear pictures of the vehicle to support the report.
          </p>

          {vehiclePhotos.length > 0 ? (
            <p className={styles.helperText}>
              {vehiclePhotos.length} vehicle picture(s) selected.
            </p>
          ) : null}
        </div>
      </div>
      
        <div className={styles.checkboxRow}>
          <input
            id="allow_public_contact"
            type="checkbox"
            checked={allowPublicContact}
            onChange={(e) => setAllowPublicContact(e.target.checked)}
          />
          <label htmlFor="allow_public_contact" className={styles.checkboxLabel}>
            Allow owner phone to be revealed after a valid sighting report
          </label>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        {successMessage ? <div className={styles.success}>{successMessage}</div> : null}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Submitting..." : "Submit Case"}
        </button>
      </form>
    </section>
  );
}

export default function NewCasePage() {
  return (
    <Suspense fallback={null}>
      <NewCaseFormPage />
    </Suspense>
  );
}
