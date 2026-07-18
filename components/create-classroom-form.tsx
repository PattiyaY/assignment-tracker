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
        + New classroom
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 flex flex-col gap-3 max-w-md">
      <div>
        <label className="label block mb-1.5">Class name</label>
        <input
          className="input"
          placeholder="e.g. Grade 9 — Biology"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label block mb-1.5">Subject (optional)</label>
        <input
          className="input"
          placeholder="e.g. Biology"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-clay">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Creating…" : "Create classroom"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
