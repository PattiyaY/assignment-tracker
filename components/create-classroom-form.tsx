"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClassroom } from "@/lib/actions";

export default function CreateClassroomForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const classroom = await createClassroom({ name, subject });
      setOpen(false);
      setName("");
      setSubject("");
      router.push(`/classrooms/${classroom.id}/settings`);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create classroom.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + ห้องเรียนใหม่
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 flex flex-col gap-3 max-w-md">
      <div>
        <label className="label block mb-1.5">ชื่อห้องเรียน</label>
        <input
          className="input"
          placeholder="เช่น ชั้นมัธยมศึกษาปีที่ 1 — ชีววิทยา"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label block mb-1.5">วิชา (ไม่บังคับ)</label>
        <input
          className="input"
          placeholder="เช่น ชีววิทยา"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-clay">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "กำลังสร้าง…" : "สร้างห้องเรียน"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setOpen(false)}
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
