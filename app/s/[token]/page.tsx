"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

// A student opens this private link (shared by their teacher) and is
// signed in automatically as themselves. If the teacher set a PIN on
// this student, we ask for it before completing sign-in.
export default function StudentAccessPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [needsPin, setNeedsPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function attempt(withPin?: string) {
    setLoading(true);
    setError(null);
    const res = await signIn("student", {
      token: params.token,
      pin: withPin ?? "",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      // Could be: invalid link, or a PIN is required/incorrect.
      // Try silently once without a PIN before asking for one.
      if (!withPin) {
        setNeedsPin(true);
        return;
      }
      setError("That PIN doesn't look right. Try again.");
      return;
    }
    router.push("/classrooms/redirect");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted text-sm">Signing you in…</p>
      </main>
    );
  }

  if (needsPin) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            attempt(pin);
          }}
          className="max-w-xs w-full"
        >
          <p className="label text-clay mb-2">One more step</p>
          <h1 className="font-display text-2xl mb-6">Enter your class PIN</h1>
          <input
            className="input font-mono text-center text-lg tracking-widest"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={8}
            autoFocus
          />
          {error && <p className="text-sm text-clay mt-2">{error}</p>}
          <button type="submit" className="btn btn-primary w-full mt-4">
            Continue
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <p className="text-clay text-sm">
        This link isn't valid anymore. Ask your teacher for a fresh one.
      </p>
    </main>
  );
}
