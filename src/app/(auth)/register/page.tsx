"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerUser, loginWithGoogle } from "@/lib/auth";
import { acceptInviteById, getInviteById } from "@/lib/firestore";
import { UserRole } from "@/types";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "admin", label: "Admin", desc: "Full access, manage members" },
  { value: "manager", label: "Manager", desc: "Manage tasks & teams" },
  { value: "member", label: "Member", desc: "Create & update tasks" },
  { value: "viewer", label: "Viewer", desc: "Read-only access" },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("invite");
  const inviteTeam = searchParams.get("team");

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);

  // Validate invite on mount
  useEffect(() => {
    if (!inviteId) return;
    getInviteById(inviteId).then((invite) => {
      setInviteValid(!!invite && invite.status === "pending");
      if (invite?.role) setRole(invite.role);
    });
  }, [inviteId]);

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    // Skip role step if invited (role is pre-set)
    if (inviteId && inviteValid) {
      handleRegister(name.trim(), email.trim(), password, role);
    } else {
      setStep(2);
    }
  }

  async function handleRegister(
    displayName: string,
    emailVal: string,
    pwd: string,
    userRole: UserRole,
  ) {
    setError("");
    setLoading(true);
    try {
      const firebaseUser = await registerUser(
        emailVal,
        pwd,
        displayName,
        userRole,
      );
      // Accept invite if present
      if (inviteId && inviteValid) {
        await acceptInviteById(inviteId, {
          uid: firebaseUser.uid,
          displayName,
          email: emailVal,
          role: userRole,
          joinedAt: new Date(),
        });
      }
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("email-already-in-use") ?
          "An account with this email already exists."
        : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleRegister(name.trim(), email.trim(), password, role);
  }

  async function handleGoogle() {
    setError("");
    setGoogleLoad(true);
    try {
      const firebaseUser = await loginWithGoogle();
      if (inviteId && inviteValid) {
        await acceptInviteById(inviteId, {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? "User",
          email: firebaseUser.email ?? "",
          role,
          joinedAt: new Date(),
        });
      }
      router.push("/dashboard");
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoad(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            TaskFlow
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
            {inviteId ? "You've been invited" : "Get started in 2 steps"}
          </p>

          {inviteId && inviteTeam ?
            <div className="bg-white/8 border border-white/15 rounded-2xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/30 flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-violet-300"
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
              </div>
              <p className="text-white font-bold text-lg">
                Join {decodeURIComponent(inviteTeam)}
              </p>
              <p className="text-slate-400 text-sm">
                You&apos;ve been invited to collaborate. Create your account to
                accept.
              </p>
              {inviteValid === false && (
                <p className="text-red-400 text-xs mt-2">
                  ⚠ This invite link has already been used or is invalid.
                </p>
              )}
            </div>
          : [
              {
                n: "01",
                title: "Your details",
                desc: "Name, email, and a strong password",
              },
              {
                n: "02",
                title: "Choose a role",
                desc: "Set your default access level",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                  (step === 1 && i === 0) || (step === 2 && i === 1) ?
                    "bg-white/8 border-white/15"
                  : "border-transparent opacity-50"
                }`}
              >
                <span className="text-2xl font-bold text-violet-400 leading-none">
                  {s.n}
                </span>
                <div>
                  <p className="text-white font-semibold text-sm">{s.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))
          }
        </div>

        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-4 h-4 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-medium">
                Free forever on the Spark plan
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                No credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-violet-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <span className="font-bold text-slate-900">TaskFlow</span>
          </div>

          {/* Invite banner */}
          {inviteId && inviteTeam && inviteValid && (
            <div className="flex items-center gap-2.5 bg-violet-50 border border-violet-200 text-violet-700 text-sm rounded-xl px-4 py-3 mb-6">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Joining{" "}
              <strong className="mx-1">{decodeURIComponent(inviteTeam)}</strong>{" "}
              as <strong className="ml-1 capitalize">{role}</strong>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
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

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                  {inviteId ? "Accept your invite" : "Create your account"}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  {inviteId ?
                    "Fill in your details to join the team"
                  : "Start managing tasks with your team"}
                </p>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={googleLoad}
                className="w-full flex items-center justify-center gap-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl py-2.5 text-sm transition-all mb-5 disabled:opacity-50"
              >
                {googleLoad ?
                  <svg
                    className="w-4 h-4 animate-spin"
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
                : <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={nextStep} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Tunde Usman"
                    className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min. 8 characters"
                      className="w-full border border-slate-200 hover:border-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                    >
                      {showPwd ?
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
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      : <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      }
                    </button>
                  </div>
                  {password && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            password.length >= i * 3 ?
                              i <= 1 ? "bg-red-400"
                              : i <= 2 ? "bg-amber-400"
                              : i <= 3 ? "bg-blue-400"
                              : "bg-emerald-500"
                            : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full border hover:border-slate-300 focus:ring-2 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all ${
                      confirm && confirm !== password ?
                        "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-violet-500 focus:ring-violet-500/10"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors mt-1"
                >
                  {inviteId && inviteValid ?
                    loading ?
                      "Joining…"
                    : "Join team"
                  : "Continue →"}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2 (no invite) ── */}
          {step === 2 && !inviteId && (
            <>
              <div className="mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-4 transition-colors"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
                <h1 className="text-2xl font-bold text-slate-900">
                  Pick your role
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  You can change this later in settings
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      role === r.value ?
                        "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        role === r.value ?
                          "border-violet-500 bg-violet-500"
                        : "border-slate-300"
                      }`}
                    >
                      {role === r.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${role === r.value ? "text-violet-700" : "text-slate-800"}`}
                      >
                        {r.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                  </button>
                ))}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {loading ?
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
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
                      Creating account…
                    </>
                  : "Create account"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-violet-600 hover:text-violet-700 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400 mt-8">
            © 2026 TaskFlow · Secure by design
          </p>
        </div>
      </div>
    </div>
  );
}
