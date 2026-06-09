"use client";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { Task } from "@/types";

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">
          {value}
        </p>
        <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <Link
      href="/tasks"
      className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-colors group"
    >
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          task.priority === "urgent" ? "bg-red-500"
          : task.priority === "high" ? "bg-amber-500"
          : task.priority === "medium" ? "bg-blue-500"
          : "bg-slate-300"
        }`}
      />
      <p className="flex-1 text-sm text-slate-700 truncate group-hover:text-slate-900 transition-colors">
        {task.title}
      </p>
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusColor(task.status)}`}
      >
        {task.status.replace("_", " ")}
      </span>
      {task.dueDate && (
        <span
          className={`text-xs flex-shrink-0 ${task.dueDate < new Date() ? "text-red-500" : "text-slate-400"}`}
        >
          {formatDate(task.dueDate)}
        </span>
      )}
    </Link>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { tasks, loading } = useTasks();

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < new Date() && t.status !== "done",
  ).length;
  const urgent = tasks.filter(
    (t) => t.priority === "urgent" && t.status !== "done",
  ).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const recent = [...tasks].slice(0, 5);
  const dueSoon = tasks
    .filter((t) => t.dueDate && t.status !== "done")
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning"
    : hour < 17 ? "Good afternoon"
    : "Good evening";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {greeting}, {profile?.displayName?.split(" ")[0] ?? "there"} 👋
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total === 0 ?
              "No tasks yet — create your first one"
            : `You have ${total - done} open task${total - done !== 1 ? "s" : ""}${overdue > 0 ? `, ${overdue} overdue` : ""}`
            }
          </p>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
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
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New task
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total tasks"
          value={loading ? "—" : total}
          sub="All time"
          color="bg-slate-100"
          icon={
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={loading ? "—" : done}
          sub={`${pct}% done`}
          color="bg-emerald-50"
          icon={
            <svg
              className="w-5 h-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="In progress"
          value={loading ? "—" : inProgress}
          sub="Active now"
          color="bg-blue-50"
          icon={
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <StatCard
          label="Overdue"
          value={loading ? "—" : overdue}
          sub={urgent > 0 ? `${urgent} urgent` : "On track"}
          color="bg-red-50"
          icon={
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">
              Overall progress
            </p>
            <p className="text-sm font-bold text-slate-900">{pct}%</p>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            {(["todo", "in_progress", "in_review", "done"] as const).map(
              (s) => {
                const count = tasks.filter((t) => t.status === s).length;
                return (
                  <span
                    key={s}
                    className={`flex items-center gap-1.5 ${getStatusColor(s)} px-2 py-0.5 rounded-full font-medium`}
                  >
                    {count} {s.replace("_", " ")}
                  </span>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent tasks */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent tasks</h3>
            <Link
              href="/tasks"
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              View all
            </Link>
          </div>
          {loading ?
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          : recent.length === 0 ?
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No tasks yet</p>
              <Link
                href="/tasks"
                className="text-violet-600 text-xs font-medium mt-1 inline-block hover:underline"
              >
                Create your first task →
              </Link>
            </div>
          : recent.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>

        {/* Due soon */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Due soon</h3>
            <Link
              href="/tasks"
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              View all
            </Link>
          </div>
          {loading ?
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          : dueSoon.length === 0 ?
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No upcoming deadlines</p>
              <p className="text-slate-300 text-xs mt-1">
                Tasks with due dates will appear here
              </p>
            </div>
          : dueSoon.map((t) => <TaskRow key={t.id} task={t} />)}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            href: "/tasks",
            label: "Manage tasks",
            sub: `${total - done} open`,
            color: "text-violet-600 bg-violet-50",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            ),
          },
          {
            href: "/teams",
            label: "Your team",
            sub: "Manage members",
            color: "text-blue-600 bg-blue-50",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ),
          },
          {
            href: "/reports",
            label: "Reports",
            sub: `${pct}% complete`,
            color: "text-emerald-600 bg-emerald-50",
            icon: (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            ),
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition-all group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}
            >
              {card.icon}
            </div>
            <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
              {card.label}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
