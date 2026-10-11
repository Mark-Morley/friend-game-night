"use client";

import { FormEvent, useState } from "react";

export default function AccessForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Could not unlock the lobby.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Could not reach the lobby. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="access-page">
      <div className="access-card">
        <div className="brand-mark" aria-hidden="true">✳</div>
        <p className="eyebrow">PRIVATE LOBBY · FRIENDS ONLY</p>
        <h1>Game night<br /><span>starts here.</span></h1>
        <p className="access-copy">The next great session is one invite away. Enter your crew&apos;s password to see what&apos;s on.</p>
        <form onSubmit={unlock} className="access-form">
          <label htmlFor="lobby-password">Lobby password</label>
          <input
            id="lobby-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-wide" type="submit" disabled={busy}>
            {busy ? "Checking..." : "Enter the lobby"} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <p className="fine-print">A little corner of the internet for your crew.</p>
      </div>
      <div className="access-decoration" aria-hidden="true">
        <span className="orbit orbit-one" /><span className="orbit orbit-two" />
        <span className="pixel pixel-one">✦</span><span className="pixel pixel-two">✳</span>
      </div>
    </main>
  );
}
