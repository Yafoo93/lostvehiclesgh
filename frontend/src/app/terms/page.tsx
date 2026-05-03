import styles from "../public-pages.module.css";

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Terms</p>
          <h1 className={styles.title}>Terms of Use</h1>
          <p className={styles.subtitle}>
            These terms explain the expected use of Lost Vehicle Registry Ghana
            for public searches, owner reports, sighting reports, and moderated
            case handling.
          </p>
        </div>
      </section>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Use of the service</h2>
          <p className={styles.text}>
            You may use the platform to search vehicle status, register your own
            vehicles, submit missing or stolen vehicle cases, upload relevant
            evidence, and send sighting reports. You must provide accurate
            information and must not submit false, misleading, abusive, or
            unlawful content.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Vehicle reports and evidence</h2>
          <ul className={styles.list}>
            <li>You should submit reports only for vehicles you own or are authorized to report.</li>
            <li>Police case details and uploaded evidence should be genuine and relevant.</li>
            <li>Moderators may request more information, reject a case, or flag suspicious activity.</li>
            <li>Verified public status depends on moderation and may be updated if recovery or correction details are reviewed.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Public search results</h2>
          <p className={styles.text}>
            Public search results are provided for informational checks only.
            They should not be treated as legal proof of ownership, lawful sale,
            theft, recovery, or title status. A no-record result does not
            guarantee that a vehicle has no legal or ownership issue.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Prohibited actions</h2>
          <ul className={styles.list}>
            <li>Submitting false police details, fake documents, or fraudulent reports.</li>
            <li>Using the service to harass, threaten, expose, or impersonate another person.</li>
            <li>Trying to access accounts, documents, or case data without permission.</li>
            <li>Scraping, overloading, or abusing public search or API endpoints.</li>
            <li>Publishing private contact or evidence information obtained through the platform.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Official reporting</h2>
          <p className={styles.text}>
            The platform does not replace official reporting to the Ghana Police
            Service, DVLA, insurers, or any lawful authority. Vehicle owners
            should still use official reporting channels and keep official case
            documents.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Changes and availability</h2>
          <p className={styles.text}>
            Platform features, moderation rules, search behavior, and access
            controls may change as the service develops. Access may be limited
            or suspended where misuse, suspicious activity, or security risk is
            detected.
          </p>
          <p className={styles.note}>
            These terms are a product-facing draft and should be reviewed before
            formal public launch.
          </p>
        </section>
      </div>
    </main>
  );
}
