import SearchForm from "@/components/forms/SearchForm";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.heroCard}>
          <h1 className={styles.title}>Lost Vehicle Registry Ghana</h1>
          <p className={styles.subtitle}>
            Search a vehicle by VIN or engine number to check whether it has been
            reported stolen.
          </p>

          <SearchForm />
        </section>
      </div>
    </main>
  );
}