"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({ label = "Sign out" }: { label?: string }) {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className="btn btn-secondary">
      {label}
    </button>
  );
}
