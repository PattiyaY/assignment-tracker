"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("teacher", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    const session = await getSession();
    const role = session?.user?.role;
    if (role === "ADMIN") {
      router.push("/admin/teachers");
    } else if (role === "TEACHER") {
      router.push("/dashboard");
    } else {
      router.push("/classrooms/redirect");
    }
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <p className="label text-clay mb-2">เข้าสู่ระบบ</p>
        <h1 className="font-display text-3xl mb-8">ยินดีต้อนรับกลับ</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label block mb-1.5" htmlFor="email">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label block mb-1.5" htmlFor="password">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-clay">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-xs text-muted mt-3">
          นักเรียน: ใช้ลิงก์เข้าห้องเรียนที่ครูส่งให้แทนหน้าเข้าสู่ระบบนี้
        </p>
      </div>
    </main>
  );
}
