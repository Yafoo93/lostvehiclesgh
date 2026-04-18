"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/types/api";
import styles from "./HomeHeader.module.css";

export default function HomeHeader() {
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const currentUser = await fetchCurrentUser();
        if (!active) return;
        setUser(currentUser);
      } catch {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) {
          setChecked(true);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [pathname]);

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

          {checked && user ? (
            <>
              <Link href="/dashboard" className={styles.navLink}>
                {displayName}
              </Link>

              <Link href="/dashboard" className={styles.dashboardLink}>
                Dashboard
              </Link>
            </>
          ) : (
            <Link href="/auth/login?next=/" className={styles.navLink}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}