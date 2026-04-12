"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearTokens, fetchCurrentUser } from "@/lib/auth";
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

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.heading}>Dashboard</h1>
            <p className={styles.subheading}>
              Welcome, {user.first_name || user.username}
            </p>
          </div>
        </header>

        <section className={styles.content}>{children}</section>
      </div>
    </main>
  );
}