import Link from "next/link";
import styles from "./HomeFooter.module.css";

export default function HomeFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <h3 className={styles.brand}>Lost Vehicle Registry Ghana</h3>
          <p className={styles.text}>
            Helping vehicle owners, finders, and recovery teams connect through
            trusted reporting and verified case handling.
          </p>
        </div>

        <div className={styles.linksBlock}>
          <h4 className={styles.heading}>Quick Links</h4>
          <div className={styles.links}>
            <Link href="/" className={styles.link}>
              Search Vehicle
            </Link>
            <Link href="/auth/login" className={styles.link}>
              Sign in
            </Link>
            <Link href="/dashboard" className={styles.link}>
              Dashboard
            </Link>
            <Link href="/about" className={styles.link}>
              About
            </Link>
            <Link href="/terms" className={styles.link}>
              Terms of Use
            </Link>
            <Link href="/privacy" className={styles.link}>
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className={styles.contactBlock}>
          <h4 className={styles.heading}>Support</h4>
          <p className={styles.text}>Need help with a report or recovery flow?</p>
          <p className={styles.contact}>Email: support@lostvehiclesgh.com</p>
          <p className={styles.contact}>Phone: +233 XX XXX XXXX</p>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p className={styles.bottomText}>
          Copyright Lost Vehicle Registry Ghana. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
