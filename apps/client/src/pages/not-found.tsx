import { Link } from "wouter";

export default function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>
        That page does not exist. <Link href="/">Go home</Link>.
      </p>
    </main>
  );
}
