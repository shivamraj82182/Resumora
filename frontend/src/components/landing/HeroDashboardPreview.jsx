import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  FileText,
  Sparkles,
} from "lucide-react";

const SCORE = 86;
const GAUGE_LENGTH = 276;

const SCORE_ROWS = [
  { label: "Keywords Match", value: "12/15", percent: 80 },
  { label: "Resume Structure", value: "Good", percent: 92 },
  { label: "Action Verbs", value: "Needs work", percent: 62 },
];

function ResumeDocument() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -18, y: 12, rotate: -9 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: -9 }}
      transition={{ duration: 0.75, delay: 0.2 }}
      className="absolute left-[1%] top-[17%] z-0 w-[37%] max-w-[218px] sm:w-[39%]"
      aria-hidden="true"
    >
      <div className="aspect-[0.76] rounded-[18px] border border-white/55 bg-[#F7F5F8] p-4 shadow-[0_26px_70px_-20px_rgba(255,121,43,0.65)] sm:p-5">
        <div className="flex items-center gap-2 text-[#19161B]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E33D37] text-[9px] font-bold text-white">
            PDF
          </span>
          <span className="truncate text-[10px] font-semibold sm:text-[11px]">
            My Resume.pdf
          </span>
        </div>
        <div className="mt-5 h-2 w-3/5 rounded-full bg-[#24212A]/75" />
        <div className="mt-2 h-1.5 w-2/5 rounded-full bg-[#B7B3C1]" />
        <div className="mt-5 space-y-2">
          <div className="h-1.5 w-full rounded-full bg-[#D9D6DF]" />
          <div className="h-1.5 w-[88%] rounded-full bg-[#D9D6DF]" />
          <div className="h-1.5 w-[94%] rounded-full bg-[#D9D6DF]" />
          <div className="h-1.5 w-[70%] rounded-full bg-[#D9D6DF]" />
        </div>
        <div className="mt-5 h-1.5 w-2/5 rounded-full bg-[#24212A]/65" />
        <div className="mt-2 space-y-2">
          <div className="h-1.5 w-full rounded-full bg-[#D9D6DF]" />
          <div className="h-1.5 w-[86%] rounded-full bg-[#D9D6DF]" />
          <div className="h-1.5 w-[74%] rounded-full bg-[#D9D6DF]" />
        </div>
      </div>
    </motion.div>
  );
}

export function HeroDashboardPreview() {
  return (
    <div
      className="relative mx-auto h-[370px] w-full max-w-[570px] sm:h-[440px] lg:h-[460px]"
      aria-label="Preview of an ATS resume analysis"
    >
      <div className="absolute left-[18%] right-[4%] top-[12%] h-[72%] rounded-[36px] bg-[#FF792B]/20 blur-[60px]" />

      <ResumeDocument />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-0 top-[8%] z-10 w-[88%] max-w-[450px] rounded-[22px] border border-white/15 p-3.5 shadow-[0_32px_80px_-22px_rgba(0,0,0,0.82),0_0_45px_rgba(255,121,43,0.12)] backdrop-blur-xl sm:right-[1%] sm:top-[7%] sm:w-[82%] sm:rounded-[26px] sm:p-5"
        style={{
          background:
            "linear-gradient(145deg, rgba(33,28,34,0.97) 0%, rgba(19,18,24,0.98) 52%, rgba(13,13,17,0.99) 100%)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/resumora-logo.svg"
            alt=""
            className="h-7 w-7 rounded-lg"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-white">ATS Score</span>
        </div>

        <div className="relative mx-auto mt-1 w-[210px] max-w-full sm:mt-2 sm:w-[230px]">
          <svg viewBox="0 0 220 132" className="block h-auto w-full">
            <defs>
              <linearGradient id="resumora-hero-gauge" x1="20" y1="0" x2="200" y2="0">
                <stop offset="0%" stopColor="#F24736" />
                <stop offset="52%" stopColor="#FF9A20" />
                <stop offset="100%" stopColor="#10D985" />
              </linearGradient>
            </defs>
            <path
              d="M 20 112 A 90 90 0 0 1 200 112"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="13"
              strokeLinecap="round"
            />
            <motion.path
              d="M 20 112 A 90 90 0 0 1 200 112"
              fill="none"
              stroke="url(#resumora-hero-gauge)"
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={GAUGE_LENGTH}
              initial={{ strokeDashoffset: GAUGE_LENGTH }}
              animate={{ strokeDashoffset: GAUGE_LENGTH * (1 - SCORE / 100) }}
              transition={{ duration: 1.3, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-x-0 top-[52%] flex items-baseline justify-center gap-1">
            <span className="font-display text-[38px] font-semibold leading-none tracking-tight text-white sm:text-[42px]">
              {SCORE}
            </span>
            <span className="text-sm font-medium text-white/55">/100</span>
          </div>
        </div>

        <div className="mx-auto -mt-1 flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold text-emerald-300">
          <Check size={12} strokeWidth={3} />
          Strong Match
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035]">
          {SCORE_ROWS.map((row, index) => (
            <div
              key={row.label}
              className={`flex items-center gap-2.5 px-3 py-2 ${
                index > 0 ? "border-t border-white/[0.07]" : ""
              }`}
            >
              <span
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                  row.percent > 75
                    ? "bg-emerald-500 text-white"
                    : "bg-[#FF792B]/20 text-[#FF9A45]"
                }`}
              >
                {row.percent > 75 ? (
                  <Check size={11} strokeWidth={3} />
                ) : (
                  <AlertCircle size={11} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-white/80 sm:text-[11px]">
                {row.label}
              </span>
              <span
                className={`shrink-0 text-[9px] font-semibold sm:text-[10px] ${
                  row.percent > 75 ? "text-emerald-300" : "text-[#FF9A45]"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-2.5">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/80">
            <Sparkles size={12} className="text-[#FF9A45]" />
            Top Issues
          </div>
          <span className="rounded-full bg-[#FF792B]/15 px-2 py-0.5 text-[9px] font-semibold text-[#FF9A45]">
            3 to improve
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {["Add more action verbs", "Tailor keywords"].map((issue) => (
            <span
              key={issue}
              className="inline-flex items-center gap-1 rounded-md bg-white/[0.045] px-2 py-1 text-[9px] text-white/55"
            >
              <AlertCircle size={9} className="text-[#FF9A45]" />
              {issue}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.75 }}
        className="absolute bottom-[8%] right-[7%] z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-[#211b20]/90 px-3 py-2 text-[10px] text-white/75 shadow-lg backdrop-blur sm:flex"
      >
        <FileText size={13} className="text-[#FF9A45]" />
        Resume analysis complete
      </motion.div>
    </div>
  );
}
