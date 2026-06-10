"use client";
import { useEffect, useState } from "react";
import { subscribeTasks } from "@/lib/firestore";
import { useAuth } from "@/components/AuthProvider";
import { Task } from "@/types";

export function useTasks() {
  const { user, profile, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to resolve before querying
    if (authLoading) return;
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeTasks(user.uid, profile?.teamId ?? null, (t) => {
      setTasks(t);
      setLoading(false);
    });
    return () => unsub();
  }, [user, profile?.teamId, authLoading]);

  return { tasks, loading };
}
