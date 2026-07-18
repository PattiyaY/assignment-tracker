"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateClassroom, deleteClassroom } from "@/lib/actions";

export default function EditClassroomForm({
  classroomId,
  initialName,
  initialSubject,
}: {
  classroomId: string;
  initialName: string;
  initialSubject: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateClassroom(classroomId, { name, subject });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  async function onDelete() {
    await deleteClassroom(classroomId);
    router.push("/dashboard");
  }

  return (
    <div className="card p-5 max-w-md">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div>
          <label className="label block mb-1.5">Class name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label block mb-1.5">Subject</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm text-mossdark">Saved.</span>}
        </div>
      </form>

      <div className="border-t border-line mt-5 pt-4">
        {confirmingDelete ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-clay">Delete this classroom and all its data?</span>
            <button className="btn btn-danger" onClick={onDelete}>Yes, delete</button>
            <button className="btn btn-secondary" onClick={() => setConfirmingDelete(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
            Delete classroom
          </button>
        )}
      </div>
    </div>
  );
}
