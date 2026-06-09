"use client";
import { useEffect, useState } from "react";
import { subscribeTasks } from "@/lib/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Task } from "@/types";

export function useTasks() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeTasks(user.uid, profile?.teamId ?? null, (t) => {
      setTasks(t);
      setLoading(false);
    });
    return () => unsub();
  }, [user, profile?.teamId]);

  return { tasks, loading };
}
