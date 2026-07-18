"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({
  label = "ออกจากระบบ",
}: {
  label?: string;
}) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="btn btn-secondary"
    >
      {label}
    </button>
  );
}
