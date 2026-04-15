import HomeHeader from "@/components/home/HomeHeader";
import HeroSearch from "@/components/home/HeroSearch";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <HomeHeader />

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
    </main>
  );
}