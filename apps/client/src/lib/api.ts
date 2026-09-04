export interface AuthProviders {
  google: boolean;
  email: boolean;
  devLogin: boolean;
}

export async function fetchAuthProviders(): Promise<AuthProviders> {
  const res = await fetch("/api/auth/providers", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load auth providers");
  return res.json();
}

export async function requestMagicLink(email: string, callbackUrl?: string): Promise<void> {
  const res = await fetch("/api/auth/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, callbackUrl }),
  });
  if (!res.ok) throw new Error("Failed to send the sign-in link");
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST", credentials: "include" });
}

export function googleSignInUrl(callbackUrl?: string): string {
  const url = new URL("/api/auth/google", window.location.origin);
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  return url.toString();
}

export function devSignInUrl(callbackUrl?: string): string {
  const url = new URL("/api/auth/dev-login", window.location.origin);
  if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
  return url.toString();
}
