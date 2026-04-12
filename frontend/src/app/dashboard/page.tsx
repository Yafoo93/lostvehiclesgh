import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.text}>
        Login successful. Your dashboard shell is now working.
      </p>
    </section>
  );
}