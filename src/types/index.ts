export type UserRole = "admin" | "manager" | "member" | "viewer";

export interface AppUser {
  uid:         string;
  email:       string;
  displayName: string;
  photoURL:    string | null;
  role:        UserRole;
  teamId:      string | null;
  createdAt:   Date;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus   = "todo" | "in_progress" | "in_review" | "done";

export interface Task {
  id:          string;
  title:       string;
  description: string;
  status:      TaskStatus;
  priority:    TaskPriority;
  tags:        string[];
  assigneeId:  string | null;
  assigneeName:string | null;
  creatorId:   string;
  creatorName: string;
  teamId:      string | null;
  dueDate:     Date | null;
  completedAt: Date | null;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface Team {
  id:          string;
  name:        string;
  description: string;
  ownerId:     string;
  members:     TeamMember[];
  createdAt:   Date;
}

export interface TeamMember {
  uid:         string;
  displayName: string;
  email:       string;
  role:        UserRole;
  joinedAt:    Date;
}

export interface Invite {
  id:        string;
  teamId:    string;
  teamName:  string;
  email:     string;
  role:      UserRole;
  invitedBy: string;
  status:    "pending" | "accepted" | "declined";
  createdAt: Date;
}