"use client";
import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { Task, TaskStatus, TaskPriority } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

// ── palette ───────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "#94a3b8",
  in_progress: "#3b82f6",
  in_review: "#8b5cf6",
  done: "#10b981",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "#94a3b8",
  medium: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

// ── helpers ───────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── build last-7-days activity data ──────────────────────────────────────────
function buildActivityData(tasks: Task[]) {
  const days: { date: string; created: number; completed: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    days.push({
      date: d.toLocaleDateString("en-NG", { weekday: "short" }),
      created: tasks.filter((t) => t.createdAt >= d && t.createdAt < next)
        .length,
      completed: tasks.filter(
        (t) => t.completedAt && t.completedAt >= d && t.completedAt < next,
      ).length,
    });
  }
  return days;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { tasks, loading } = useTasks();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== "done",
    ).length;
    const urgent = tasks.filter(
      (t) => t.priority === "urgent" && t.status !== "done",
    ).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const avgDays = (() => {
      const completed = tasks.filter((t) => t.completedAt && t.createdAt);
      if (!completed.length) return null;
      const avg =
        completed.reduce((sum, t) => {
          return sum + (t.completedAt!.getTime() - t.createdAt.getTime());
        }, 0) / completed.length;
      return Math.round(avg / (1000 * 60 * 60 * 24));
    })();

    const byStatus: { name: string; value: number; color: string }[] = (
      Object.entries(STATUS_COLORS) as [TaskStatus, string][]
    )
      .map(([s, color]) => ({
        name: s.replace("_", " "),
        value: tasks.filter((t) => t.status === s).length,
        color,
      }))
      .filter((d) => d.value > 0);

    const byPriority: { name: string; value: number; color: string }[] = (
      Object.entries(PRIORITY_COLORS) as [TaskPriority, string][]
    )
      .map(([p, color]) => ({
        name: p,
        value: tasks.filter((t) => t.priority === p).length,
        color,
      }))
      .filter((d) => d.value > 0);

    const byAssignee = Object.values(
      tasks.reduce(
        (acc, t) => {
          const key = t.assigneeName ?? "Unassigned";
          if (!acc[key]) acc[key] = { name: key, total: 0, done: 0 };
          acc[key].total++;
          if (t.status === "done") acc[key].done++;
          return acc;
        },
        {} as Record<string, { name: string; total: number; done: number }>,
      ),
    )
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const activity = buildActivityData(tasks);

    return {
      total,
      done,
      overdue,
      urgent,
      pct,
      avgDays,
      byStatus,
      byPriority,
      byAssignee,
      activity,
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-white border border-slate-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-slate-600 font-semibold">No data yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Create some tasks to see your reports
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total tasks"
          value={stats.total}
          color="text-slate-900"
          sub="All time"
        />
        <StatCard
          label="Completion rate"
          value={`${stats.pct}%`}
          color="text-emerald-600"
          sub={`${stats.done} of ${stats.total} done`}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          color="text-red-500"
          sub={stats.urgent > 0 ? `${stats.urgent} urgent` : "None urgent"}
        />
        <StatCard
          label="Avg. completion"
          value={stats.avgDays !== null ? `${stats.avgDays}d` : "—"}
          color="text-violet-600"
          sub="Days to complete"
        />
      </div>

      {/* Activity line chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Activity — last 7 days
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={stats.activity}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="created"
              name="Created"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#8b5cf6" }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3, fill: "#10b981" }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-3 justify-center">
          {[
            { color: "#8b5cf6", label: "Created" },
            { color: "#10b981", label: "Completed" },
          ].map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-1.5 text-xs text-slate-500"
            >
              <span
                className="w-3 h-0.5 rounded-full inline-block"
                style={{ backgroundColor: l.color }}
              />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Status + Priority charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status donut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Tasks by status
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {stats.byStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {stats.byStatus.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-xs text-slate-600 capitalize">
                      {s.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority bar */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Tasks by priority
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={stats.byPriority}
              margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                {stats.byPriority.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assignee breakdown */}
      {stats.byAssignee.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Tasks by assignee
          </h3>
          <div className="space-y-3">
            {stats.byAssignee.map((a) => {
              const pct =
                a.total > 0 ? Math.round((a.done / a.total) * 100) : 0;
              return (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {a.name === "Unassigned" ?
                      "–"
                    : a.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {a.name}
                      </p>
                      <p className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {a.done}/{a.total} · {pct}%
                      </p>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
