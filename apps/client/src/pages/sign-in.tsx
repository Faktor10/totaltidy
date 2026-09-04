import { useEffect, useState } from "react";
import { useSearchParams } from "wouter";
import type { AuthProviders } from "@/lib/api";
import { fetchAuthProviders, googleSignInUrl, requestMagicLink } from "@/lib/api";
import styles from "./sign-in.module.css";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Google sign-in did not complete. Please try again.",
  link: "That sign-in link is invalid or has expired. Request a new one.",
};

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;
  const errorCode = searchParams.get("error");

  const [providers, setProviders] = useState<AuthProviders | null>(null);
  const [providersFailed, setProvidersFailed] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    fetchAuthProviders()
      .then(setProviders)
      .catch(() => setProvidersFailed(true));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    try {
      await requestMagicLink(email, callbackUrl);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Sign In</h1>
      <p className={styles.subtitle}>Sign in to TotalTidy to manage your inventory.</p>

      {errorCode && ERROR_MESSAGES[errorCode] && (
        <p className={styles.error} role="alert">
          {ERROR_MESSAGES[errorCode]}
        </p>
      )}

      {providers?.google && (
        <a className={styles.googleButton} href={googleSignInUrl(callbackUrl)}>
          Continue with Google
        </a>
      )}

      {providers?.email && (
        <>
          {providers.google && <div className={styles.divider}>or</div>}

          {status === "sent" ? (
            <p className={styles.sent} role="status">
              Check your inbox — we sent a sign-in link to {email}.
            </p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button className={styles.submit} type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Email me a sign-in link"}
              </button>
              {status === "error" && (
                <p className={styles.error} role="alert">
                  Could not send the link. Please try again.
                </p>
              )}
            </form>
          )}
        </>
      )}

      {providersFailed && (
        <p className={styles.error} role="alert">
          Could not reach the sign-in service. Check that the API server is running, then reload.
        </p>
      )}

      {!providers && !providersFailed && <p className={styles.subtitle}>Loading sign-in options...</p>}

      {providers && !providers.google && !providers.email && (
        <p className={styles.error}>
          No sign-in method is configured. Set AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET or AUTH_RESEND_KEY.
        </p>
      )}
    </main>
  );
}
