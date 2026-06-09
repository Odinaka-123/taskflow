"use client";
import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { deleteTask, updateTask } from "@/lib/firestore";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { cn, formatDate, getPriorityColor, getStatusColor } from "@/lib/utils";
import TaskModal from "@/components/tasks/TaskModal";

// ── constants ─────────────────────────────────────────────────────────────────
const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo",        label: "To do"       },
  { value: "in_progress", label: "In progress" },
  { value: "in_review",   label: "In review"   },
  { value: "done",        label: "Done"         },
];

const KANBAN_COLORS: Record<TaskStatus, string> = {
  todo:        "border-t-slate-300",
  in_progress: "border-t-blue-400",
  in_review:   "border-t-violet-400",
  done:        "border-t-emerald-400",
};

// ── TaskCard (list row) ───────────────────────────────────────────────────────
function TaskRow({
  task, onEdit, onDelete, onStatusChange,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: TaskStatus) => void;
}) {
  const overdue = task.dueDate && task.dueDate < new Date() && task.status !== "done";

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all group">
      {/* Done checkbox */}
      <button
        onClick={() => onStatusChange(task.id, task.status === "done" ? "todo" : "done")}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          task.status === "done"
            ? "bg-emerald-500 border-emerald-500"
            : "border-slate-300 hover:border-emerald-400"
        )}>
        {task.status === "done" && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", {
        "bg-red-500":    task.priority === "urgent",
        "bg-amber-500":  task.priority === "high",
        "bg-blue-500":   task.priority === "medium",
        "bg-slate-300":  task.priority === "low",
      })}/>

      {/* Title + tags */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", task.status === "done" ? "line-through text-slate-400" : "text-slate-800")}>
          {task.title}
        </p>
        {task.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {task.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Assignee */}
      {task.assigneeName && (
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold">
            {task.assigneeName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <span className="hidden lg:inline truncate max-w-[80px]">{task.assigneeName}</span>
        </span>
      )}

      {/* Due date */}
      {task.dueDate && (
        <span className={cn("text-xs flex-shrink-0 hidden sm:block", overdue ? "text-red-500 font-medium" : "text-slate-400")}>
          {overdue ? "⚠ " : ""}{formatDate(task.dueDate)}
        </span>
      )}

      {/* Status badge */}
      <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 hidden md:block", getStatusColor(task.status))}>
        {task.status.replace("_", " ")}
      </span>

      {/* Priority badge */}
      <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 hidden lg:block", getPriorityColor(task.priority))}>
        {task.priority}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(task)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button onClick={() => onDelete(task.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── KanbanCard ────────────────────────────────────────────────────────────────
function KanbanCard({ task, onEdit, onDelete }: { task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const overdue = task.dueDate && task.dueDate < new Date() && task.status !== "done";
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group cursor-pointer" onClick={() => onEdit(task)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={cn("text-sm font-medium text-slate-800 leading-snug flex-1", task.status === "done" && "line-through text-slate-400")}>
          {task.title}
        </p>
        <button onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-red-500 transition-all flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-2">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map(t => (
            <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", getPriorityColor(task.priority))}>
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={cn("text-[10px]", overdue ? "text-red-500 font-medium" : "text-slate-400")}>
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.assigneeName && (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold">
              {task.assigneeName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { tasks, loading } = useTasks();

  const [view,          setView]          = useState<"list" | "kanban">("list");
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editTask,      setEditTask]      = useState<Task | null>(null);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState<TaskStatus | "all">("all");
  const [filterPriority,setFilterPriority]= useState<TaskPriority | "all">("all");

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch   = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.includes(search.toLowerCase()));
      const matchStatus   = filterStatus   === "all" || t.status   === filterStatus;
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, filterStatus, filterPriority]);

  function openNew()         { setEditTask(null); setModalOpen(true); }
  function openEdit(t: Task) { setEditTask(t);    setModalOpen(true); }

  async function handleDelete(id: string) {
    if (confirm("Delete this task?")) await deleteTask(id);
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    await updateTask(id, { status });
  }

  // Kanban columns
  const columns = STATUSES.map(s => ({
    ...s,
    tasks: filtered.filter(t => t.status === s.value),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl text-sm bg-white transition-all"/>
        </div>

        {/* Filters */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus | "all")}
          className="border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-700 transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10">
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as TaskPriority | "all")}
          className="border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-700 transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10">
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(["list","kanban"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize", v === view ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              {v}
            </button>
          ))}
        </div>

        {/* New task */}
        <button onClick={openNew}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
          New task
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400 font-medium">
        {loading ? "Loading…" : `${filtered.length} task${filtered.length !== 1 ? "s" : ""}${search || filterStatus !== "all" || filterPriority !== "all" ? " (filtered)" : ""}`}
      </p>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-14 bg-white border border-slate-100 rounded-xl animate-pulse"/>)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-slate-600 font-semibold">No tasks found</p>
          <p className="text-slate-400 text-sm mt-1">{search ? "Try a different search" : "Create your first task to get started"}</p>
          {!search && (
            <button onClick={openNew} className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
              Create task
            </button>
          )}
        </div>
      )}

      {/* ── List view ── */}
      {!loading && filtered.length > 0 && view === "list" && (
        <div className="space-y-2">
          {filtered.map(t => (
            <TaskRow key={t.id} task={t} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange}/>
          ))}
        </div>
      )}

      {/* ── Kanban view ── */}
      {!loading && filtered.length > 0 && view === "kanban" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => (
            <div key={col.value} className={cn("bg-slate-50 rounded-2xl border-t-4 p-3", KANBAN_COLORS[col.value])}>
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{col.label}</p>
                <span className="text-xs font-semibold text-slate-400 bg-white border border-slate-200 rounded-full px-2 py-0.5">{col.tasks.length}</span>
              </div>
              <div className="space-y-2">
                {col.tasks.map(t => (
                  <KanbanCard key={t.id} task={t} onEdit={openEdit} onDelete={handleDelete}/>
                ))}
                <button onClick={openNew}
                  className="w-full flex items-center gap-1.5 justify-center py-2 text-xs text-slate-400 hover:text-violet-600 hover:bg-white border border-dashed border-slate-200 hover:border-violet-300 rounded-xl transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Add task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        task={editTask}
      />
    </div>
  );
}