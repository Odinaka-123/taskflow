"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  createTeam,
  subscribeTeam,
  inviteMember,
  updateMemberRole,
  removeMember,
} from "@/lib/firestore";
import { Team, TeamMember, UserRole } from "@/types";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = ["admin", "manager", "member", "viewer"];

const ROLE_COLOR: Record<UserRole, string> = {
  admin: "text-red-600 bg-red-50",
  manager: "text-amber-600 bg-amber-50",
  member: "text-blue-600 bg-blue-50",
  viewer: "text-slate-500 bg-slate-100",
};

function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const cls =
    size === "sm" ? "w-7 h-7 text-[10px]"
    : size === "lg" ? "w-12 h-12 text-base"
    : "w-9 h-9 text-xs";
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0",
        cls,
      )}
    >
      {initials}
    </div>
  );
}

// ── Create team modal ─────────────────────────────────────────────────────────
function CreateTeamModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user || !profile) return;
    setLoading(true);
    setError("");
    try {
      const owner: TeamMember = {
        uid: user.uid,
        displayName: profile.displayName,
        email: profile.email,
        role: "admin",
        joinedAt: new Date(),
      };
      await createTeam(name.trim(), desc.trim(), owner);
      onCreated();
      onClose();
    } catch {
      setError("Failed to create team. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Create a team</h2>
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
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Team name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Engineering"
              className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What does this team do?"
              rows={3}
              className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? "Creating…" : "Create team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Invite modal ──────────────────────────────────────────────────────────────
function InviteModal({
  open,
  onClose,
  team,
}: {
  open: boolean;
  onClose: () => void;
  team: Team;
}) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !user) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await inviteMember(
        team.id,
        team.name,
        email.trim().toLowerCase(),
        role,
        user.uid,
      );
      setSuccess(true);
      setEmail("");
    } catch {
      setError("Failed to send invite. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Invite to {team.name}
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
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Invite sent to {email || "member"}!
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Email address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="colleague@company.com"
              className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "py-2 text-xs font-semibold rounded-xl border-2 capitalize transition-all",
                    role === r ?
                      `${ROLE_COLOR[r]} border-current`
                    : "text-slate-500 bg-white border-slate-200 hover:border-slate-300",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TeamsPage() {
  const { user, profile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const isOwnerOrAdmin =
    team &&
    (team.ownerId === user?.uid ||
      team.members.find((m) => m.uid === user?.uid)?.role === "admin");

  useEffect(() => {
    if (!profile?.teamId) {
      setLoading(false);
      return;
    }
    const unsub = subscribeTeam(profile.teamId, (t) => {
      setTeam(t);
      setLoading(false);
    });
    return () => unsub();
  }, [profile?.teamId]);

  async function handleRoleChange(uid: string, role: UserRole) {
    if (!team) return;
    await updateMemberRole(team.id, uid, role);
  }

  async function handleRemove(uid: string) {
    if (!team) return;
    if (uid === team.ownerId) return alert("You can't remove the team owner.");
    if (confirm("Remove this member from the team?"))
      await removeMember(team.id, uid);
  }

  // ── No team ───────────────────────────────────────────────────────────────
  if (!loading && !profile?.teamId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            You&apos;re not in a team yet
          </h2>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            Create a new team to start collaborating, or wait for a team invite
            from a colleague.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            Create a team
          </button>
        </div>
        <CreateTeamModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => window.location.reload()}
        />
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-white border border-slate-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!team) return null;

  // ── Team view ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Team header card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {team.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{team.name}</h2>
              {team.description && (
                <p className="text-sm text-slate-500 mt-0.5">
                  {team.description}
                </p>
              )}
            </div>
          </div>
          {isOwnerOrAdmin && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Invite
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-5 pt-5 border-t border-slate-100">
          {[
            { label: "Members", value: team.members.length },
            {
              label: "Admins",
              value: team.members.filter((m) => m.role === "admin").length,
            },
            {
              label: "Managers",
              value: team.members.filter((m) => m.role === "manager").length,
            },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Members ({team.members.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-50">
          {team.members.map((member) => {
            const isYou = member.uid === user?.uid;
            const isOwner = member.uid === team.ownerId;
            const canEdit = isOwnerOrAdmin && !isOwner && !isYou;

            return (
              <div
                key={member.uid}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <Avatar name={member.displayName} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {member.displayName}
                    </p>
                    {isYou && (
                      <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                    {isOwner && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {member.email}
                  </p>
                </div>

                {/* Role selector or badge */}
                {canEdit ?
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.uid, e.target.value as UserRole)
                    }
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer capitalize transition-all focus:ring-2 focus:ring-violet-500/20",
                      ROLE_COLOR[member.role],
                    )}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                : <span
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full capitalize",
                      ROLE_COLOR[member.role],
                    )}
                  >
                    {member.role}
                  </span>
                }

                {/* Remove button */}
                {canEdit && (
                  <button
                    onClick={() => handleRemove(member.uid)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite modal */}
      {team && (
        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          team={team}
        />
      )}
    </div>
  );
}
