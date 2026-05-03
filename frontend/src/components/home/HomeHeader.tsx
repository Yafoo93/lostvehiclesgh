"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./HomeHeader.module.css";

export default function HomeHeader() {
  const { user, loading } = useAuth();

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : "";

  const reportHref = user
    ? "/dashboard/vehicles/new"
    : "/auth/login?next=/dashboard/vehicles/new";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <div className={styles.logoWrap}>
            <Image
              src="/logo.png"
              alt="Lost Vehicle Registry Ghana logo"
              width={56}
              height={56}
              className={styles.logo}
              priority
            />
          </div>

          <div className={styles.brandText}>
            <span className={styles.companyName}>Lost Vehicle Registry Ghana</span>
            <span className={styles.companyTag}>Search. Report. Recover.</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link href={reportHref} className={styles.reportLink}>
            Report Missing Vehicle
          </Link>

          {!loading && user ? (
            <>
              <Link href="/dashboard" className={styles.navLink}>
                {displayName}
              </Link>

              <Link href="/dashboard" className={styles.dashboardLink}>
                Dashboard
              </Link>
            </>
          ) : !loading ? (
            <Link href="/auth/login?next=/" className={styles.navLink}>
              Sign in
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
