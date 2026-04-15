"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/types/api";
import styles from "./HomeHeader.module.css";

export default function HomeHeader() {
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
  }, []);

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : "";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoMark}>LVR</span>
          <div className={styles.brandText}>
            <span className={styles.companyName}>Lost Vehicle Registry Ghana</span>
            <span className={styles.companyTag}>
              Search. Report. Recover.
            </span>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link href="/auth/login" className={styles.navLink}>
            {checked && user ? displayName : "Sign in"}
          </Link>

          <Link href="/dashboard" className={styles.dashboardLink}>
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}