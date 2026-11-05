import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  CircleGauge,
  Play,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";
import { DarkPanel } from "./DarkPanel";
import { HeroDashboardPreview } from "./HeroDashboardPreview";

const QUICK_FEATURES = [
  {
    icon: CircleGauge,
    title: "ATS Score",
    description: "Know how your resume matches job requirements.",
  },
  {
    icon: Sparkles,
    title: "AI Rewrite",
    description: "Get ATS-friendly, impactful resume suggestions.",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Detailed Insights",
    description: "Find gaps, missing keywords, and easy fixes.",
  },
  {
    icon: Zap,
    title: "Faster Interviews",
    description: "Improve your chances of getting shortlisted.",
  },
];

export function HeroSection() {
  return (
    <section id="home" className="relative w-full scroll-mt-24">
      <DarkPanel
        className="w-full min-h-[760px] lg:min-h-[790px]"
        radius="rounded-b-[32px] sm:rounded-b-[44px]"
      >
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
          viewBox="0 0 1440 820"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="hero-wave-orange" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#FF792B" stopOpacity="0" />
              <stop offset=".52" stopColor="#FF792B" stopOpacity=".24" />
              <stop offset="1" stopColor="#FF9A45" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hero-wave-violet" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#8B5CF6" stopOpacity="0" />
              <stop offset=".5" stopColor="#8B5CF6" stopOpacity=".14" />
              <stop offset="1" stopColor="#FF792B" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-120 650C140 500 205 860 480 700s360-145 555-88 335-10 520-235"
            fill="none"
            stroke="url(#hero-wave-orange)"
            strokeWidth="2"
          />
          <path
            d="M-130 685C120 535 220 885 493 733s363-146 555-88 333-10 510-229"
            fill="none"
            stroke="url(#hero-wave-orange)"
            strokeOpacity=".58"
            strokeWidth="1"
          />
          <path
            d="M-100 610C145 458 221 814 477 665s364-145 563-89 333-4 520-224"
            fill="none"
            stroke="url(#hero-wave-violet)"
            strokeWidth="1"
          />
        </svg>

        <div
          className="relative px-5 sm:px-8 lg:px-12 pt-28 sm:pt-32 lg:pt-32 pb-7 sm:pb-9"
          style={{ maxWidth: 1320, marginLeft: "auto", marginRight: "auto" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr] gap-8 lg:gap-8 items-center">
            <div className="text-white">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#FF792B]/35 bg-[#FF792B]/10 px-3.5 py-2 backdrop-blur-md"
              >
                <Sparkles size={14} className="text-[#FF9A45]" />
                <span className="text-[11px] sm:text-xs tracking-wide text-white/90 font-semibold">
                  AI-powered resume analysis
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="font-display text-[43px] sm:text-[52px] lg:text-[48px] xl:text-[54px] 2xl:text-[60px] font-semibold leading-[1.02] tracking-[-0.045em] mt-6"
              >
                Beat the ATS.
                <br />
                Land more{" "}
                <span className="bg-gradient-to-r from-[#FF792B] via-[#FF812B] to-[#FF9A45] bg-clip-text text-transparent">
                  Interviews.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="text-white/65 text-[15px] sm:text-base lg:text-[17px] mt-5 max-w-[570px] leading-relaxed"
              >
                Upload your resume and get an instant ATS score, detailed
                feedback, and AI-rewritten bullets that actually stand out —
                built for engineers, by engineers.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="flex flex-wrap items-center gap-3 mt-7"
              >
                <Link
                  to="/register"
                  className="group relative inline-flex h-12 items-center gap-2 rounded-full px-5 text-[13px] sm:text-sm font-semibold text-white shadow-[0_10px_32px_-8px_rgba(255,121,43,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_38px_-8px_rgba(255,121,43,0.68)] active:scale-[0.98]"
                  style={{
                    background:
                      "linear-gradient(135deg, #FF9A45 0%, #FF792B 58%, #F05D16 100%)",
                  }}
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
                  <span className="relative">Upload Your Resume</span>
                  <ArrowRight
                    size={15}
                    className="relative transition-transform group-hover:translate-x-0.5"
                  />
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 text-[13px] sm:text-sm font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/[0.09]"
                >
                  <Play size={13} fill="currentColor" />
                  See How it Works
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center gap-x-5 gap-y-2.5 mt-6 text-[11px] sm:text-xs text-white/60"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#FF9A45]" />
                  No credit card required
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap size={13} className="text-[#FF9A45]" />
                  Free ATS analysis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UsersRound size={14} className="text-[#FF9A45]" />
                  47,300+ resumes analyzed
                </span>
              </motion.div>
            </div>

            <div className="relative min-w-0">
              <HeroDashboardPreview />
            </div>
          </div>

          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.35 + index * 0.07 }}
                  className="flex min-h-[92px] items-start gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-sm"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF792B]/[0.14] text-[#FF9A45]">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-white/95">
                      {feature.title}
                    </span>
                    <span className="mt-1 block text-[11px] leading-relaxed text-white/55">
                      {feature.description}
                    </span>
                  </span>
                </motion.article>
              );
            })}
          </div>
        </div>
      </DarkPanel>
    </section>
  );
}
