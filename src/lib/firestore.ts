import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Task, Team, TeamMember, Invite, UserRole } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────
function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return null;
}

function docToTask(d: {
  id: string;
  data: () => Record<string, unknown>;
}): Task {
  const data = d.data();
  return {
    id: d.id,
    title: (data.title as string) ?? "",
    description: (data.description as string) ?? "",
    status: (data.status as Task["status"]) ?? "todo",
    priority: (data.priority as Task["priority"]) ?? "medium",
    tags: (data.tags as string[]) ?? [],
    assigneeId: (data.assigneeId as string) ?? null,
    assigneeName: (data.assigneeName as string) ?? null,
    creatorId: (data.creatorId as string) ?? "",
    creatorName: (data.creatorName as string) ?? "",
    teamId: (data.teamId as string) ?? null,
    dueDate: toDate(data.dueDate),
    completedAt: toDate(data.completedAt),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
  } as Task;
}

// ── tasks ─────────────────────────────────────────────────────────────────────
export function subscribeTasks(
  uid: string,
  teamId: string | null,
  callback: (tasks: Task[]) => void,
) {
  const q =
    teamId ?
      query(
        collection(db, "tasks"),
        where("teamId", "==", teamId),
        orderBy("createdAt", "desc"),
      )
    : query(
        collection(db, "tasks"),
        where("creatorId", "==", uid),
        orderBy("createdAt", "desc"),
      );

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(docToTask));
  });
}

export async function createTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">,
) {
  return addDoc(collection(db, "tasks"), {
    ...data,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(id: string, data: Partial<Task>) {
  return updateDoc(doc(db, "tasks", id), {
    ...data,
    updatedAt: serverTimestamp(),
    ...(data.status === "done" ? { completedAt: serverTimestamp() } : {}),
    ...(data.status && data.status !== "done" ? { completedAt: null } : {}),
  });
}

export async function deleteTask(id: string) {
  return deleteDoc(doc(db, "tasks", id));
}

// ── teams ─────────────────────────────────────────────────────────────────────
export async function createTeam(
  name: string,
  description: string,
  owner: TeamMember,
) {
  const ref = await addDoc(collection(db, "teams"), {
    name,
    description,
    ownerId: owner.uid,
    members: [{ ...owner, joinedAt: serverTimestamp() }],
    createdAt: serverTimestamp(),
  });
  // update user's teamId
  await updateDoc(doc(db, "users", owner.uid), { teamId: ref.id });
  return ref;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, "teams", teamId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Team;
}

export function subscribeTeam(
  teamId: string,
  callback: (team: Team | null) => void,
) {
  return onSnapshot(doc(db, "teams", teamId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Team) : null);
  });
}

export async function inviteMember(
  teamId: string,
  teamName: string,
  email: string,
  role: UserRole,
  invitedBy: string,
) {
  return addDoc(collection(db, "invites"), {
    teamId,
    teamName,
    email,
    role,
    invitedBy,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getInvitesForEmail(email: string): Promise<Invite[]> {
  const q = query(
    collection(db, "invites"),
    where("email", "==", email),
    where("status", "==", "pending"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invite);
}

export async function acceptInvite(invite: Invite, member: TeamMember) {
  // add member to team
  const teamSnap = await getDoc(doc(db, "teams", invite.teamId));
  if (!teamSnap.exists()) return;
  const team = teamSnap.data() as Team;
  await updateDoc(doc(db, "teams", invite.teamId), {
    members: [
      ...(team.members ?? []),
      { ...member, role: invite.role, joinedAt: serverTimestamp() },
    ],
  });
  // update invite status
  await updateDoc(doc(db, "invites", invite.id), { status: "accepted" });
  // update user teamId
  await updateDoc(doc(db, "users", member.uid), {
    teamId: invite.teamId,
    role: invite.role,
  });
}

export async function updateMemberRole(
  teamId: string,
  uid: string,
  role: UserRole,
) {
  const snap = await getDoc(doc(db, "teams", teamId));
  if (!snap.exists()) return;
  const team = snap.data() as Team;
  const members = team.members.map((m: TeamMember) =>
    m.uid === uid ? { ...m, role } : m,
  );
  await updateDoc(doc(db, "teams", teamId), { members });
  await updateDoc(doc(db, "users", uid), { role });
}

export async function removeMember(teamId: string, uid: string) {
  const snap = await getDoc(doc(db, "teams", teamId));
  if (!snap.exists()) return;
  const team = snap.data() as Team;
  const members = team.members.filter((m: TeamMember) => m.uid !== uid);
  await updateDoc(doc(db, "teams", teamId), { members });
  await updateDoc(doc(db, "users", uid), { teamId: null });
}
