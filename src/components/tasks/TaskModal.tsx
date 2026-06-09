"use client";
import { useState, useEffect } from "react";
import { Task, TaskPriority, TaskStatus, TeamMember } from "@/types";
import { createTask, updateTask } from "@/lib/firestore";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  members?: TeamMember[];
}

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-slate-600 bg-slate-100" },
  { value: "medium", label: "Medium", color: "text-blue-600 bg-blue-50" },
  { value: "high", label: "High", color: "text-amber-600 bg-amber-50" },
  { value: "urgent", label: "Urgent", color: "text-red-600 bg-red-50" },
];

export default function TaskModal({
  open,
  onClose,
  task,
  members = [],
}: Props) {
  const { user, profile } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId ?? "");
      setDueDate(task.dueDate ? task.dueDate.toISOString().split("T")[0] : "");
      setTags(task.tags ?? []);
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setAssigneeId("");
      setDueDate("");
      setTags([]);
    }
    setError("");
  }, [task, open]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((v) => [...v, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((v) => v.filter((x) => x !== t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required.");
    if (!user || !profile) return;
    setLoading(true);
    setError("");

    const assignee = members.find((m) => m.uid === assigneeId);

    try {
      if (task) {
        await updateTask(task.id, {
          title: title.trim(),
          description,
          status,
          priority,
          tags,
          assigneeId: assigneeId || null,
          assigneeName: assignee?.displayName ?? null,
          dueDate: dueDate ? new Date(dueDate) : null,
        });
      } else {
        await createTask({
          title: title.trim(),
          description,
          status,
          priority,
          tags,
          assigneeId: assigneeId || null,
          assigneeName: assignee?.displayName ?? null,
          creatorId: user.uid,
          creatorName: profile.displayName,
          teamId: profile.teamId ?? null,
          dueDate: dueDate ? new Date(dueDate) : null,
        });
      }
      onClose();
    } catch {
      setError("Failed to save task. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {task ? "Edit task" : "New task"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="What needs to be done?"
              className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details…"
              rows={3}
              className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all resize-none"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white transition-all"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Priority
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "text-xs font-semibold px-2 py-1.5 rounded-lg border-2 transition-all",
                      priority === p.value ?
                        `${p.color} border-current`
                      : "text-slate-500 bg-white border-slate-200 hover:border-slate-300",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignee + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white transition-all"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag…"
                className="flex-1 border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full font-medium"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-violet-400 hover:text-violet-600 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ?
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving…
              </>
            : task ?
              "Save changes"
            : "Create task"}
          </button>
        </div>
      </div>
    </div>
  );
}
