import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, User, Mail, Lock } from "lucide-react";

import {
  AuthShell,
  AuthField,
  AuthPrimaryButton,
  AuthErrorBanner,
} from "@/components/auth/AuthShell";

import AILogo from "@/components/layout/AILogo";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { register, googleRegister } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();

    setErr("");
    setLoading(true);

    try {
      await register(form);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

async function onGoogleRegister() {
  setErr("");
  setGoogleLoading(true);

  try {
    await googleRegister();
    nav("/dashboard");
  } catch (e) {
    setErr(e.message || "Google registration failed");
  } finally {
    setGoogleLoading(false);
  }
}
  const isLoading = loading || googleLoading;

  return (
    <AuthShell
      headline={
        <>
          Your resume,
          <br />
          <em style={{ fontStyle: "italic" }}>intelligently sharpened.</em>
        </>
      }
      subhead="Drop your PDF, get an ATS score, fix what's weak, and land interviews — powered by AI."
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-12">
          <AILogo size={48} />
        </div>

        <h1 className="font-display text-[34px] font-semibold tracking-tight text-[var(--ink)] leading-[1.05]">
          Get started
        </h1>

        <p className="text-[var(--ink-muted)] mt-2 text-[15px]">
          Free to start. No credit card required.
        </p>

        <form onSubmit={onSubmit} className="mt-9 space-y-4">
          <AuthField
            label="Full name"
            autoComplete="name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Enter your Name"
            icon={User}
          />

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
            autoComplete="new-password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder="At least 8 characters"
            minLength={8}
            icon={Lock}
          />

          <AuthErrorBanner>{err}</AuthErrorBanner>

          <div className="pt-1">
            <AuthPrimaryButton type="submit" disabled={isLoading}>
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account <ArrowRight size={15} />
                </>
              )}
            </AuthPrimaryButton>
          </div>
        </form>

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

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={onGoogleRegister}
          disabled={isLoading}
          className="w-full h-11 rounded-xl border border-gray-300 bg-white text-[#202124] font-semibold text-sm flex items-center justify-center gap-3 hover:bg-[#f8f9fa] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <>
              <Loader2 size={17} className="animate-spin text-[#202124]" />
              Creating account with Google...
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

        {/* Login link */}
        <div className="text-sm text-[var(--ink-muted)] text-center mt-8">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[var(--accent-strong)] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </div>

        <p className="text-[11px] text-[var(--ink-muted)]/80 text-center mt-6 leading-relaxed">
          By creating an account you agree to our terms.
          <br />
          We never share your resume data with third parties.
        </p>
      </motion.div>
    </AuthShell>
  );
}
