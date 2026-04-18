import HeroSearch from "@/components/home/HeroSearch";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Lost Vehicle Registry Ghana</p>
          <h1 className={styles.title}>
            Search a vehicle instantly by VIN or engine number
          </h1>
          <p className={styles.subtitle}>
            Check whether a vehicle has been reported missing or stolen, and
            take the right next step if it has been found.
          </p>

          <HeroSearch />
        </div>
      </section>

      <section className={styles.trustSection}>
        <div className={styles.trustInner}>
          <div className={styles.trustIntro}>
            <p className={styles.sectionKicker}>Why use Lost Vehicle Registry Ghana</p>
            <h2 className={styles.sectionTitle}>
              Built for safer vehicle checks and structured reporting
            </h2>
            <p className={styles.sectionText}>
              Our platform helps vehicle owners, buyers, moderators, and the public
              work with clearer vehicle status checks and guided reporting flows.
            </p>
          </div>

          <div className={styles.trustGrid}>
            <article className={styles.trustCard}>
              <h3 className={styles.cardTitle}>Verified Case Workflow</h3>
              <p className={styles.cardText}>
                Stolen and missing vehicle reports follow a structured workflow
                from submission to moderation and final status updates.
              </p>
            </article>

            <article className={styles.trustCard}>
              <h3 className={styles.cardTitle}>Public Vehicle Search</h3>
              <p className={styles.cardText}>
                Search by VIN or engine number to quickly check whether a vehicle
                has an existing reported case.
              </p>
            </article>

            <article className={styles.trustCard}>
              <h3 className={styles.cardTitle}>Moderated Reviews</h3>
              <p className={styles.cardText}>
                Case handling is reviewed through moderator and admin workflows
                before key public-case decisions are confirmed.
              </p>
            </article>

            <article className={styles.trustCard}>
              <h3 className={styles.cardTitle}>Faster Recovery Support</h3>
              <p className={styles.cardText}>
                Clear reporting details, police references, and supporting documents
                help improve coordination when vehicles are flagged or found.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}