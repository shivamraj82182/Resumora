import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Mail, Lock } from "lucide-react";
import {
  AuthShell,
  AuthField,
  AuthPrimaryButton,
  AuthErrorBanner,
} from "@/components/auth/AuthShell";
import AILogo from "@/components/layout/AILogo";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await login(form);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleLogin() {
    setErr("");
    setGoogleLoading(true);

    try {
      await googleLogin();
      nav("/dashboard");
    } catch (e) {
      setErr(e.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      headline={
        <>
          Sharpen your resume,
          <br />
          <em style={{ fontStyle: "italic" }}>with intelligence.</em>
        </>
      }
      subhead="Score against ATS, fix weak bullets, and ship a stronger version of yourself in minutes."
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-12">
          <AILogo size={48} />
        </div>

        <h1 className="font-display text-[34px] font-semibold tracking-tight text-gray-800 leading-[1.05]">
          Welcome back
        </h1>

        <p className="text-[var(--ink-muted)] mt-2 text-[15px]">
          Sign in to keep sharpening your resume.
        </p>

        <form onSubmit={onSubmit} className="mt-9 space-y-4">
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="you@example.com"
            icon={Mail}
          />

          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder="••••••••"
            icon={Lock}
            extra={
              <button
                type="button"
                className="text-xs text-[var(--accent-strong)] font-semibold hover:underline"
              >
                Forgot?
              </button>
            }
          />

          <AuthErrorBanner>{err}</AuthErrorBanner>

          {/* Email Login */}
          <div className="pt-1">
            <AuthPrimaryButton
              type="submit"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={15} />
                </>
              )}
            </AuthPrimaryButton>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>

            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--surface)] px-3 text-[var(--ink-muted)]">
                OR
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full h-11 rounded-xl border border-[var(--border)] bg-white text-gray-800 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Signing in with Google...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.23c0-.79-.07-1.55-.2-2.28H12v4.31h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
                  />

                  <path
                    fill="#34A853"
                    d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.5Z"
                  />

                  <path
                    fill="#FBBC05"
                    d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.09.31-1.59V7.88H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.12l3.24-2.53Z"
                  />

                  <path
                    fill="#EA4335"
                    d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.5 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38Z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </form>

        <div className="text-sm text-[var(--ink-muted)] text-center mt-8">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[var(--accent-strong)] font-semibold hover:underline"
          >
            Create one
          </Link>
        </div>
      </motion.div>
    </AuthShell>
  );
}
