import styles from "../public-pages.module.css";

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>About</p>
          <h1 className={styles.title}>Lost Vehicle Registry Ghana</h1>
          <p className={styles.subtitle}>
            A public vehicle-status search and case reporting platform built to
            help owners, buyers, finders, and moderators handle missing or
            stolen vehicle reports with more structure.
          </p>
        </div>
      </section>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What the platform does</h2>
          <p className={styles.text}>
            Lost Vehicle Registry Ghana lets vehicle owners register vehicles,
            submit missing or stolen vehicle cases, upload supporting evidence,
            and track case status. Public users can search by VIN or engine
            number to check whether a vehicle has a verified public case.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How cases are handled</h2>
          <ul className={styles.list}>
            <li>Owners create vehicle records and submit case details.</li>
            <li>Police extracts and vehicle photos can be uploaded as evidence.</li>
            <li>Moderators review case details before public status changes.</li>
            <li>Only verified stolen and recovered cases appear in public search.</li>
            <li>Recovery requests are reviewed before a case is marked recovered.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Important limits</h2>
          <p className={styles.text}>
            The platform is not a replacement for reporting vehicle theft to the
            Ghana Police Service or any lawful authority. Owners should still
            report incidents through official channels and keep their official
            police references.
          </p>
          <p className={styles.note}>
            Public search results are informational and depend on submitted,
            moderated case data. A no-record result does not prove that a vehicle
            is safe, lawfully owned, or free from dispute.
          </p>
        </section>
      </div>
    </main>
  );
}
