"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createVehicle } from "@/lib/dashboard";
import styles from "./page.module.css";

export default function NewVehiclePage() {
  const router = useRouter();

  const [plateNumber, setPlateNumber] = useState("");
  const [vin, setVin] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!vin.trim() || !make.trim() || !model.trim()) {
      setError("VIN, make, and model are required.");
      return;
    }

    try {
      setLoading(true);

      await createVehicle({
        plate_number: plateNumber.trim() || undefined,
        vin: vin.trim(),
        engine_number: engineNumber.trim() || undefined,
        make: make.trim(),
        model: model.trim(),
        year: year.trim() ? Number(year) : undefined,
        color: color.trim() || undefined,
      });

      setSuccessMessage("Vehicle added successfully. Redirecting to dashboard...");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vehicle.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.page}>
      <h2 className={styles.title}>Add Vehicle</h2>
      <p className={styles.text}>
        Enter the vehicle details you want to manage on the platform.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="plate_number" className={styles.label}>
              Plate Number (Optional)
            </label>
            <input
              id="plate_number"
              className={styles.input}
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="e.g. GR-1234-24"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="color" className={styles.label}>
              Color
            </label>
            <input
              id="color"
              className={styles.input}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Black"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="make" className={styles.label}>
              Make
            </label>
            <input
              id="make"
              className={styles.input}
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Toyota"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="model" className={styles.label}>
              Model
            </label>
            <input
              id="model"
              className={styles.input}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Corolla"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="vin" className={styles.label}>
              VIN
            </label>
            <input
              id="vin"
              className={styles.input}
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="Required VIN"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="engine_number" className={styles.label}>
              Engine Number
            </label>
            <input
              id="engine_number"
              className={styles.input}
              value={engineNumber}
              onChange={(e) => setEngineNumber(e.target.value)}
              placeholder="Optional engine number"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="year" className={styles.label}>
            Year
          </label>
          <input
            id="year"
            type="number"
            className={styles.input}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Optional year"
          />
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        {successMessage ? <div className={styles.success}>{successMessage}</div> : null}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Saving..." : "Save Vehicle"}
        </button>
      </form>
    </section>
  );
}
