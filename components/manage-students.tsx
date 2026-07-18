"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addStudent,
  updateStudent,
  deleteStudent,
  regenerateStudentLink,
  setStudentPin,
} from "@/lib/actions";

type Student = {
  id: string;
  number: number;
  name: string;
  email: string | null;
  accessToken: string;
  hasPin: boolean;
};

export default function ManageStudents({
  classroomId,
  students,
  siteUrl,
}: {
  classroomId: string;
  students: Student[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [pinDraftId, setPinDraftId] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await addStudent(classroomId, { name: newName.trim(), email: newEmail.trim() || undefined });
    setNewName("");
    setNewEmail("");
    router.refresh();
  }

  function startEdit(s: Student) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditEmail(s.email ?? "");
  }

  async function saveEdit(id: string) {
    await updateStudent(id, { name: editName.trim(), email: editEmail.trim() || undefined });
    setEditingId(null);
    router.refresh();
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from this classroom? This deletes their submission history.`)) return;
    await deleteStudent(id);
    router.refresh();
  }

  function linkFor(token: string) {
    return `${siteUrl}/s/${token}`;
  }

  async function copyLink(s: Student) {
    await navigator.clipboard.writeText(linkFor(s.accessToken));
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function regenerate(id: string) {
    if (!confirm("Generate a new link for this student? The old link will stop working.")) return;
    await regenerateStudentLink(id);
    router.refresh();
  }

  async function savePin(id: string) {
    await setStudentPin(id, pinValue.trim() || null);
    setPinDraftId(null);
    setPinValue("");
    router.refresh();
  }

  async function clearPin(id: string) {
    await setStudentPin(id, null);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="p-5 border-b border-line">
        <form onSubmit={onAdd} className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="label block mb-1.5">Student name</label>
            <input className="input w-48" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <div>
            <label className="label block mb-1.5">Email (optional)</label>
            <input className="input w-56" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Add student</button>
        </form>
      </div>

      <ul className="divide-y divide-line">
        {students.map((s) => (
          <li key={s.id} className="p-4">
            {editingId === s.id ? (
              <div className="flex flex-wrap gap-2 items-end">
                <input className="input w-40" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <input className="input w-56" type="email" placeholder="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                <button className="btn btn-primary" onClick={() => saveEdit(s.id)}>Save</button>
                <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-muted mr-2">#{s.number}</span>
                  <span className="font-medium">{s.name}</span>
                  {s.email && <span className="text-sm text-muted ml-2">{s.email}</span>}
                  {s.hasPin && <span className="text-xs ml-2 px-1.5 py-0.5 rounded bg-line text-muted">PIN set</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-secondary" onClick={() => copyLink(s)}>
                    {copiedId === s.id ? "Copied!" : "Copy private link"}
                  </button>
                  <button className="btn btn-secondary" onClick={() => regenerate(s.id)}>Regenerate link</button>
                  {pinDraftId === s.id ? (
                    <span className="flex gap-1 items-center">
                      <input
                        className="input w-24 font-mono"
                        placeholder="4-digit"
                        value={pinValue}
                        onChange={(e) => setPinValue(e.target.value)}
                        maxLength={8}
                      />
                      <button className="btn btn-secondary" onClick={() => savePin(s.id)}>Save PIN</button>
                    </span>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => setPinDraftId(s.id)}>
                      {s.hasPin ? "Change PIN" : "Set PIN"}
                    </button>
                  )}
                  {s.hasPin && (
                    <button className="btn btn-secondary" onClick={() => clearPin(s.id)}>Remove PIN</button>
                  )}
                  <button className="btn btn-secondary" onClick={() => startEdit(s)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => onDelete(s.id, s.name)}>Remove</button>
                </div>
              </div>
            )}
          </li>
        ))}
        {students.length === 0 && (
          <li className="p-6 text-center text-muted text-sm">No students yet — add your first one above.</li>
        )}
      </ul>
    </div>
  );
}
