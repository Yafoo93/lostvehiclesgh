import styles from "../public-pages.module.css";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Privacy</p>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.subtitle}>
            This page explains the main types of data handled by Lost Vehicle
            Registry Ghana and how that data is used to support vehicle
            reporting, moderation, public search, and recovery workflows.
          </p>
        </div>
      </section>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data we collect</h2>
          <ul className={styles.list}>
            <li>Account data such as username, email, name, phone number, and role.</li>
            <li>Vehicle data such as VIN, engine number, plate number, make, model, year, and color.</li>
            <li>Case data such as police station, police case number, incident date, location, description, status, and recovery details.</li>
            <li>Uploaded evidence such as police extract files and vehicle photos.</li>
            <li>Sighting report details such as reporter contact details, location, and message.</li>
            <li>Audit data such as user actions, IP address, user agent, timestamps, and related object metadata.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How we use data</h2>
          <ul className={styles.list}>
            <li>To let owners manage vehicles and missing or stolen vehicle cases.</li>
            <li>To support moderator review and fraud checks.</li>
            <li>To show limited public information for verified stolen or recovered cases.</li>
            <li>To help vehicle finders submit sighting reports.</li>
            <li>To maintain audit records for sensitive actions.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Public disclosure</h2>
          <p className={styles.text}>
            Pending, more-info, and rejected cases are not shown in public
            vehicle search. Public search discloses limited vehicle and case
            details only for verified stolen or recovered cases.
          </p>
          <p className={styles.text}>
            Owner phone details are shared only when the case is verified stolen,
            the owner opted into public contact sharing, and the public user has
            submitted or referenced a sighting report.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data protection</h2>
          <ul className={styles.list}>
            <li>Owner and moderator workflows require authentication.</li>
            <li>Permissions restrict case, vehicle, and document access by role.</li>
            <li>Private documents are delivered through authenticated download endpoints.</li>
            <li>Public search and login endpoints are throttled.</li>
            <li>Uploaded documents are validated by file type and file size.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Retention and requests</h2>
          <p className={styles.text}>
            Formal retention periods for cases, uploaded evidence, sighting
            reports, and audit records are still being finalized before public
            launch. Users may request correction or review of their account,
            vehicle, or case data through platform support.
          </p>
          <p className={styles.note}>
            This policy should be reviewed with Ghana Data Protection Act
            requirements before production launch.
          </p>
        </section>
      </div>
    </main>
  );
}
