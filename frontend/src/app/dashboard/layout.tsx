"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearTokens, fetchCurrentUser, logoutUser } from "@/lib/auth";
import type { AuthUser } from "@/types/api";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const currentUser = await fetchCurrentUser();

        if (!isMounted) return;

        setUser(currentUser);
      } catch {
        clearTokens();
        router.replace("/auth/login");
        return;
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  function handleLogout() {
    logoutUser();
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Checking your session...</h1>
          <p className={styles.text}>Please wait a moment.</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    `${user.first_name} ${user.last_name}`.trim() || user.username;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.heading}>Dashboard</h1>
              <p className={styles.subheading}>Welcome, {displayName}</p>
            </div>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Username</span>
              <span className={styles.profileValue}>{user.username}</span>
            </div>

            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Email</span>
              <span className={styles.profileValue}>{user.email || "N/A"}</span>
            </div>

            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Role</span>
              <span className={styles.profileValue}>{user.role}</span>
            </div>

            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Phone</span>
              <span className={styles.profileValue}>{user.phone || "N/A"}</span>
            </div>
          </div>
        </header>

        <section className={styles.content}>{children}</section>
      </div>
    </main>
  );
}