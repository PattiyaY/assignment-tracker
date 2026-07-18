"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTeacherAccountForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => null);

    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "ไม่สามารถสร้างบัญชีครูได้");
      return;
    }

    setSuccess(`สร้างบัญชีครูเรียบร้อยแล้ว: ${email}`);
    setName("");
    setEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 flex flex-col gap-3 max-w-md">
      <div>
        <label className="label block mb-1.5" htmlFor="teacher-name">
          ชื่อ
        </label>
        <input
          id="teacher-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label block mb-1.5" htmlFor="teacher-email">
          อีเมล
        </label>
        <input
          id="teacher-email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label block mb-1.5" htmlFor="teacher-password">
          รหัสผ่าน
        </label>
        <input
          id="teacher-password"
          type="password"
          minLength={8}
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <p className="text-xs text-muted mt-1">ต้องมีอย่างน้อย 8 ตัวอักษร</p>
      </div>
      {error && <p className="text-sm text-clay">{error}</p>}
      {success && <p className="text-sm text-mossdark">{success}</p>}
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? "กำลังสร้าง…" : "สร้างบัญชีครู"}
      </button>
    </form>
  );
}
