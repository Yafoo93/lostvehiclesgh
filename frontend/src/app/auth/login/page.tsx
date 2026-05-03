"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginUser } from "@/lib/auth";
import styles from "./page.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    const rawNext = searchParams.get("next");

    if (!rawNext) {
      return "/dashboard";
    }

    // Only allow internal app routes.
    if (!rawNext.startsWith("/") || rawNext.startsWith("//")) {
      return "/dashboard";
    }

    return rawNext;
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);

      await loginUser({
        username: username.trim(),
        password,
      });
      await refreshUser();

      router.push(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Access your account to manage listed vehicles, cases, and sighting reports.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.footerText}>
          Don’t have an account?{" "}
          <Link href="/auth/register" className={styles.link}>
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
