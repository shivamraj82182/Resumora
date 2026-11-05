import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import AILogo from "@/components/layout/AILogo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Dashboard", href: "#dashboard-preview" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-3 inset-x-0 z-50 px-3 sm:px-6"
    >
      <div
        style={{ maxWidth: 1240, marginLeft: "auto", marginRight: "auto" }}
        className={cn(
          "rounded-2xl md:rounded-full border transition-all duration-300",
          scrolled
            ? "bg-[#111111]/90 border-white/10 backdrop-blur-xl shadow-[0_14px_45px_rgba(0,0,0,0.42)]"
            : "bg-[#111111]/80 border-white/10 backdrop-blur-md",
        )}
      >
        <div className="flex items-center justify-between gap-4 px-3 sm:px-4 py-2">
          <Link to="/" className="flex items-center gap-2.5 pl-1">
            <AILogo />
            <span className="hidden sm:flex sm:flex-col sm:gap-0.5">
              <span className="font-display text-[15px] font-semibold leading-none tracking-tight text-[var(--ink)]">
                Resumora
              </span>
              <span className="text-[9px] font-medium leading-none text-[var(--ink-muted)]">
                AI Resume Analyzer
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                aria-current={l.label === "Home" ? "page" : undefined}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors xl:px-3.5 xl:text-[13px] ${
                  l.label === "Home"
                    ? "bg-[#FF792B]/15 text-[#FF9A45] shadow-[inset_0_0_0_1px_rgba(255,121,43,0.28)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/login"
              className="hidden sm:inline-flex h-9 px-3 sm:px-4 rounded-full text-xs sm:text-[13px] font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] items-center transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="group inline-flex items-center gap-1.5 h-9 pl-3 sm:pl-4 pr-2.5 sm:pr-3.5 rounded-full text-white text-xs sm:text-[13px] font-semibold shadow-[0_6px_20px_rgba(255,107,26,0.25)] hover:shadow-[0_8px_24px_rgba(255,107,26,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg, #FF9A45, #FF792B)" }}
            >
              Get Started
              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden h-9 w-9 rounded-full flex items-center justify-center text-[var(--ink)] hover:bg-[var(--surface-2)]"
              aria-label="Toggle menu"
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="lg:hidden border-t border-[var(--border)] px-3 py-3 space-y-1"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-2)]"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              className="block px-3 py-2 rounded-xl text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-2)]"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#FF9A45] hover:bg-[var(--surface-2)]"
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
