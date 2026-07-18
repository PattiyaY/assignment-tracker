import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";

export default function NavBar({
  userName,
  role,
}: {
  userName: string;
  role: "TEACHER" | "STUDENT";
}) {
  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={role === "TEACHER" ? "/dashboard" : "#"} className="font-display text-xl">
          ClassTrack
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted">
            {userName} <span className="text-line">·</span>{" "}
            <span className="uppercase text-xs tracking-wide">{role === "TEACHER" ? "Teacher" : "Student · view only"}</span>
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
