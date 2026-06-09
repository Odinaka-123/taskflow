"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/auth";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard",    subtitle: "Overview of your workspace"  },
  "/tasks":     { title: "Tasks",        subtitle: "Manage and track your work"  },
  "/teams":     { title: "Teams",        subtitle: "Collaborate with your team"  },
  "/reports":   { title: "Reports",      subtitle: "Insights and analytics"      },
};

export default function Header() {
  const pathname  = usePathname();
  const { profile } = useAuth();
  const router    = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const page = PAGE_TITLES[pathname] ?? { title: "TaskFlow", subtitle: "" };

  const initials = profile?.displayName
    ? profile.displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  async function handleLogout() {
    setMenuOpen(false);
    await logoutUser();
    router.push("/login");
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-5 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
      {/* Left */}
      <div>
        <h1 className="text-base font-bold text-slate-900 leading-tight">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-slate-400 leading-tight">{page.subtitle}</p>}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* New Task shortcut */}
        <Link href="/tasks"
          className="hidden sm:flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
          </svg>
          New task
        </Link>

        {/* Notifications bell (placeholder) */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-white"/>
        </button>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent hover:ring-violet-200 transition-all overflow-hidden">
            {profile?.photoURL
              ? <Image src={profile.photoURL} alt="" width={32} height={32} className="w-full h-full object-cover"/>
              : initials
            }
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}/>
              <div className="absolute right-0 top-10 z-20 w-52 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 truncate">{profile?.displayName}</p>
                  <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                </div>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Profile
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile nav toggle */}
        <button className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </header>
  );
}