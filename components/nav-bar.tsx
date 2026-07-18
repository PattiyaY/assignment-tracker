import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";

export default function NavBar({
  userName,
  role,
}: {
  userName: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}) {
  const homeHref =
    role === "ADMIN"
      ? "/admin/teachers"
      : role === "TEACHER"
        ? "/dashboard"
        : "#";
  const roleLabel =
    role === "ADMIN"
      ? "ผู้ดูแลระบบ"
      : role === "TEACHER"
        ? "ครู"
        : "นักเรียน · ดูอย่างเดียว";

  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={homeHref} className="font-display text-xl">
          ClassTrack
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            {userName} <span className="text-line">·</span>{" "}
            <span className="uppercase text-xs tracking-wide">{roleLabel}</span>
          </span>
          <SignOutButton label="ออกจากระบบ" />
        </div>
      </div>
    </header>
  );
}
