import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeader } from "./FeaturesSection";

const TESTIMONIALS = [
 {
  quote:
    "The resume analysis pointed out mistakes I had completely overlooked. After fixing them, my resume felt much more professional and recruiter-friendly.",
  name: "Abhay Raghav",
  role: "AI & ML Student",
  company: "AKTU",
  initials: "AR",
},
{
  quote:
    "The ATS suggestions were simple, practical, and easy to apply. I improved my resume score significantly in less than an hour.",
  name: "Ashutosh Tiwari",
  role: "Software Engineering Student",
  company: "AKTU",
  initials: "AT",
},
{
  quote:
    "I liked how every recommendation came with a clear explanation. It wasn't just changing words—it helped me understand what recruiters actually look for.",
  name: "Gangaram Yadav",
  role: "Full Stack Developer",
  company: "Freelancer",
  initials: "GY",
},
{
  quote:
    "The resume rewrite kept my writing style while making it much stronger. It gave me the confidence to apply for internships.",
  name: "Himanshi Sharma",
  role: "Frontend Developer",
  company: "Student",
  initials: "HS",
},
{
  quote:
    "The keyword optimization feature was the highlight for me. My resume became much more relevant for the roles I was targeting.",
  name: "Shivam Rajpoot",
  role: "Backend Developer",
  company: "Open Source Contributor",
  initials: "SR",
},
{
  quote:
    "The side-by-side comparison made every change easy to understand. It felt like getting feedback from an experienced recruiter.",
  name: "Gagan Vardhan",
  role: "Software Developer",
  company: "Tech Enthusiast",
  initials: "GV",
},
];

export function TestimonialsSection() {
  return (
    <section
      className="px-3 sm:px-6 mt-28 sm:mt-36"
      style={{ maxWidth: 1240, marginLeft: "auto", marginRight: "auto" }}
    >
      <SectionHeader
        eyebrow="Testimonials"
        title={<>Loved by engineers who've been there.</>}
        sub="From new grads sweating their first SWE role to senior ICs switching domains."
      />

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
            className="rounded-[22px] bg-[var(--surface)] border border-[var(--border)] shadow-card hover:shadow-hover transition-all p-5 sm:p-6 flex flex-col"
          >
            <div className="flex gap-0.5 text-[var(--accent)] mb-3">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} size={13} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="text-[14px] text-[var(--ink)] leading-relaxed flex-1">
              "{t.quote}"
            </p>
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--border)]">
              <div className="h-9 w-9 rounded-full bg-[var(--accent-strong)] text-white flex items-center justify-center font-display text-[12px] font-semibold tabular">
                {t.initials}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[var(--ink)] truncate">
                  {t.name}
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] truncate">
                  {t.role} · {t.company}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
