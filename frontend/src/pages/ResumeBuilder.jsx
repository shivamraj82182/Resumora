import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ResumeDocument } from "@/components/export/ResumeDocument";
import { projectUrls } from "@/lib/resumeLinks";
import {
  useCreateManualResume,
  useFullVersion,
  useGenerateResume,
  useResume,
  useUpdateManualResume,
} from "@/hooks/useResumes";

const STEPS = [
  { title: "Personal Information", icon: UserRound },
  { title: "Professional Summary", icon: FileText },
  { title: "Education", icon: GraduationCap },
  { title: "Technical Skills", icon: Sparkles },
  { title: "Work Experience", icon: BriefcaseBusiness },
  { title: "Projects", icon: FileText },
  { title: "Certifications", icon: Check },
  { title: "Achievements", icon: Check },
];

const TEMPLATES = [
  { id: "modern", label: "Modern", note: "Orange detail" },
  { id: "editorial", label: "Editorial", note: "Serif heading" },
  { id: "compact", label: "Compact", note: "Tight spacing" },
];

const EMPTY_CONTENT = {
  basics: {
    name: "",
    title: "",
    location: "",
    email: "",
    phone: "",
    links: [],
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
};

const EMPTY_EDUCATION = {
  degree: "",
  school: "",
  location: "",
  period: "",
  details: [],
};

const EMPTY_EXPERIENCE = {
  company: "",
  role: "",
  location: "",
  period: "",
  bullets: [],
};

const EMPTY_PROJECT = { name: "", description: "", tech: [], link: "" };

function linesToList(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function encodeAchievements(summary, achievements) {
  const items = achievements.map((item) => item.trim()).filter(Boolean);
  if (!items.length) return summary.trim();
  return [
    summary.trim(),
    `Key Achievements\n${items.map((item) => `- ${item}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function decodeAchievements(summary = "") {
  const marker = "\n\nKey Achievements\n";
  const markerIndex = summary.lastIndexOf(marker);
  const start = markerIndex >= 0 ? markerIndex + marker.length :
    summary.startsWith("Key Achievements\n") ? "Key Achievements\n".length : -1;

  if (start < 0) return { summary, achievements: "" };
  const headingStart = markerIndex >= 0 ? markerIndex : 0;
  const achievementText = summary
    .slice(start)
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean)
    .join("\n");
  return {
    summary: summary.slice(0, headingStart).trim(),
    achievements: achievementText,
  };
}

function toApiContent(content, achievements) {
  const sections = Object.fromEntries(
    Object.entries(content).filter(([key]) => key !== "_achievements"),
  );
  return {
    ...sections,
    basics: {
      ...content.basics,
      links: content.basics.links.filter((link) => link.url.trim()),
    },
    summary: encodeAchievements(content.summary, achievements.split("\n")),
    skills: content.skills.map((skill) => skill.trim()).filter(Boolean),
    experience: content.experience.map((item) => ({
      ...item,
      bullets: item.bullets.map((bullet) => bullet.trim()).filter(Boolean),
    })),
    education: content.education.map((item) => ({
      ...item,
      details: item.details.map((detail) => detail.trim()).filter(Boolean),
    })),
    projects: content.projects.map((item) => ({
      ...item,
      tech: item.tech.map((tech) => tech.trim()).filter(Boolean),
    })),
  };
}

function contentFromVersion(sections = {}) {
  const { summary, achievements } = decodeAchievements(sections.summary || "");
  return {
    ...EMPTY_CONTENT,
    ...sections,
    basics: { ...EMPTY_CONTENT.basics, ...(sections.basics || {}) },
    summary,
    experience: (sections.experience || []).map((item) => ({
      ...item,
      bullets: item.bullets || [],
    })),
    education: (sections.education || []).map((item) => ({
      ...item,
      details: Array.isArray(item.details)
        ? item.details
        : item.details
          ? [item.details]
          : [],
    })),
    projects: (sections.projects || []).map((item) => ({
      ...item,
      link: item.link || item.links?.[0]?.url || "",
      tech: item.tech || [],
    })),
    skills: sections.skills || [],
    certifications: sections.certifications || [],
    languages: sections.languages || [],
    interests: sections.interests || [],
    _achievements: achievements,
  };
}

function createAiPreview(candidateName, targetRole, contactDetails) {
  return {
    ...EMPTY_CONTENT,
    basics: {
      ...EMPTY_CONTENT.basics,
      name: candidateName || "Full name",
      title: targetRole || "Target role",
      location: contactDetails.location,
      email: contactDetails.email,
      phone: contactDetails.phone,
      links: [
        contactDetails.linkedInUrl && {
          label: "LinkedIn",
          url: contactDetails.linkedInUrl,
        },
        contactDetails.portfolioUrl && {
          label: "GitHub / Portfolio",
          url: contactDetails.portfolioUrl,
        },
      ].filter(Boolean),
    },
    summary: "A concise, role-focused professional summary will appear here.",
    experience: [
      {
        company: "Organization",
        role: "Role title",
        location: "Location",
        period: "Dates",
        bullets: ["An impact-focused accomplishment based on your background."],
      },
    ],
    education: [{
      degree: "Degree or qualification",
      school: "School or institution",
      location: "Location",
      period: "Dates",
      details: [],
    }],
    skills: ["Relevant skill", "Technical skill"],
    projects: [{
      name: "Selected project",
      description: "A concise description of your contribution.",
      tech: ["Tools and technologies"],
      link: "",
    }],
    certifications: [{ name: "Certification", issuer: "Issuing organization", year: "Year" }],
    languages: ["Language"],
    interests: [],
    _achievements: "Relevant achievement or award",
  };
}

function Field({ label, value, onChange, multiline = false, hint, ...props }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-(--ink-muted)">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={onChange}
          className="min-h-28 w-full resize-y rounded-xl border border-(--border) bg-(--surface) px-3.5 py-3 text-sm text-(--ink) outline-none transition focus:border-(--accent)/60 focus:ring-2 focus:ring-(--accent)/15"
          {...props}
        />
      ) : (
        <Input value={value} onChange={onChange} {...props} />
      )}
      {hint && <span className="mt-1 block text-[11px] text-(--ink-muted)">{hint}</span>}
    </label>
  );
}

function ResumePreview({ content, achievements, template, placeholder = false }) {
  const basics = content.basics;
  const linkText = basics.links.map((link) => link.url).filter(Boolean).join(" · ");
  return (
    <div className={`resume-paper resume-paper--${template}${placeholder ? " resume-paper--placeholder" : ""}`}>
      <header className="resume-paper__header">
        <h2>{basics.name || "Your Name"}</h2>
        {basics.title && <p className="resume-paper__role">{basics.title}</p>}
        <p className="resume-paper__contact">
          {[basics.location, basics.email, basics.phone, linkText].filter(Boolean).join("  ·  ") || "Location · email@example.com · phone"}
        </p>
      </header>
      {content.summary && <PreviewSection title="Professional Summary"><p>{content.summary}</p></PreviewSection>}
      {content.experience.length > 0 && (
        <PreviewSection title="Work Experience">
          {content.experience.map((item, index) => (
            <div className="resume-paper__entry" key={index}>
              <div className="resume-paper__entry-head"><strong>{item.role || "Role"}</strong><span>{item.period}</span></div>
              <p className="resume-paper__meta">{[item.company, item.location].filter(Boolean).join(" · ")}</p>
              <ul>{item.bullets.filter(Boolean).map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>
            </div>
          ))}
        </PreviewSection>
      )}
      {content.education.length > 0 && (
        <PreviewSection title="Education">
          {content.education.map((item, index) => (
            <div className="resume-paper__entry" key={index}>
              <div className="resume-paper__entry-head"><strong>{item.degree || "Degree"}</strong><span>{item.period}</span></div>
              <p className="resume-paper__meta">{[item.school, item.location].filter(Boolean).join(" · ")}</p>
              {item.details.map((detail, i) => <p key={i}>{detail}</p>)}
            </div>
          ))}
        </PreviewSection>
      )}
      {content.skills.length > 0 && <PreviewSection title="Technical Skills"><p>{content.skills.join(" · ")}</p></PreviewSection>}
      {content.projects.length > 0 && (
        <PreviewSection title="Projects">
          {content.projects.map((item, index) => (
            <div className="resume-paper__entry" key={index}>
              <div className="resume-paper__entry-head"><strong>{item.name || "Project"}</strong><span>{item.tech.join(" · ")}</span></div>
              {item.description && <p>{item.description}</p>}
              {projectUrls(item, content.basics).map((url) => <p className="resume-paper__meta" key={url}>{url}</p>)}
            </div>
          ))}
        </PreviewSection>
      )}
      {content.certifications.length > 0 && <PreviewSection title="Certifications"><ul>{content.certifications.map((item, index) => <li key={index}>{[item.name, item.issuer, item.year].filter(Boolean).join(" · ")}</li>)}</ul></PreviewSection>}
      {achievements.trim() && <PreviewSection title="Key Achievements"><ul>{linesToList(achievements).map((item, index) => <li key={index}>{item}</li>)}</ul></PreviewSection>}
      {content.languages.length > 0 && <PreviewSection title="Languages"><p>{content.languages.join(" · ")}</p></PreviewSection>}
      {content.interests.length > 0 && <PreviewSection title="Interests"><p>{content.interests.join(" · ")}</p></PreviewSection>}
    </div>
  );
}

function PreviewSection({ title, children }) {
  return (
    <section className="resume-paper__section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function TemplateStyles() {
  return (
    <style>{`
      .resume-paper{box-sizing:border-box;width:100%;max-width:595px;min-height:842px;margin:0 auto;padding:42px 44px;background:#fff;color:#161616;box-shadow:0 20px 55px rgba(0,0,0,.28);font-family:Arial,sans-serif;font-size:10px;line-height:1.55;overflow-wrap:anywhere}
      .resume-paper__header{padding-bottom:18px;border-bottom:1px solid #e6e2de}
      .resume-paper__header h2{margin:0;color:#171717;font-size:26px;line-height:1.15;font-weight:700}
      .resume-paper__role{margin:5px 0 0;color:#e95b0c;font-size:12px;font-weight:600}
      .resume-paper__contact{margin:10px 0 0;color:#666;font-size:9px}
      .resume-paper__section{margin-top:17px}
      .resume-paper__section h3{margin:0 0 7px;padding-bottom:4px;border-bottom:1px solid #e6e2de;color:#e95b0c;font-size:9px;letter-spacing:1px;text-transform:uppercase}
      .resume-paper__section p{margin:2px 0}
      .resume-paper__section ul{margin:4px 0 0;padding-left:15px}
      .resume-paper__section li{margin:2px 0;padding-left:1px}
      .resume-paper__entry{margin:0 0 10px}
      .resume-paper__entry-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
      .resume-paper__entry-head strong{font-size:10px}
      .resume-paper__entry-head span,.resume-paper__meta{color:#686868;font-size:9px}
      .resume-paper--editorial{font-family:Georgia,serif;padding-top:50px}
      .resume-paper--editorial .resume-paper__header h2{font-family:Georgia,serif;font-size:31px;font-weight:500}
      .resume-paper--editorial .resume-paper__role,.resume-paper--editorial .resume-paper__section h3{color:#222}
      .resume-paper--editorial .resume-paper__header{border-bottom:2px solid #222}
      .resume-paper--compact{padding:32px 38px;font-size:9px;line-height:1.4}
      .resume-paper--compact .resume-paper__header h2{font-size:23px}
      .resume-paper--compact .resume-paper__section{margin-top:17px}
      .resume-paper--compact .resume-paper__role,.resume-paper--compact .resume-paper__section h3{color:#c94c0b}
      .resume-paper--placeholder{opacity:.76}
      .resume-paper--placeholder .resume-paper__section p,.resume-paper--placeholder .resume-paper__section li,.resume-paper--placeholder .resume-paper__meta{color:#777}
      @media(max-width:640px){.resume-paper{min-height:680px;padding:28px 24px;font-size:9px}.resume-paper__header h2{font-size:23px}.resume-paper--editorial .resume-paper__header h2{font-size:27px}}
    `}</style>
  );
}

function ResumePreviewPane({
  content,
  achievements,
  template,
  onTemplateChange,
  version,
  title,
  placeholder = false,
  loading = false,
  onOpenSaved,
}) {
  const fileName = `${(title || content.basics.name || "resume")
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "_")}.pdf`;

  return (
    <aside className="min-w-0 xl:sticky xl:top-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Live preview</h3>
          <p className="mt-0.5 text-[11px] text-(--ink-muted)">
            {placeholder ? "Example layout · your details are not filled in yet" : "Updates as your resume changes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenSaved && (
            <Button variant="outline" size="sm" onClick={onOpenSaved}>
              Open saved resume
            </Button>
          )}
          {placeholder ? (
            <Button variant="outline" size="sm" disabled title="Generate a resume before downloading">
              <Download size={13} /> PDF
            </Button>
          ) : (
            <PDFDownloadLink document={<ResumeDocument version={version} title={title || "Resume"} template={template} />} fileName={fileName}>
              {({ loading: preparing }) => (
                <Button variant="outline" size="sm" disabled={preparing}>
                  <Download size={13} />{preparing ? "Preparing…" : "PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>
      <div className="mb-3 flex gap-1 rounded-xl border border-(--border) bg-(--surface) p-1" role="group" aria-label="Resume template">
        {TEMPLATES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTemplateChange(item.id)}
            aria-pressed={template === item.id}
            className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-center transition ${template === item.id ? "bg-(--accent-soft) text-(--accent-strong)" : "text-(--ink-muted) hover:bg-(--surface-2)"}`}
          >
            <span className="block truncate text-xs font-semibold">{item.label}</span>
            <span className="hidden truncate text-[10px] sm:block">{item.note}</span>
          </button>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-xl border border-(--border) bg-[#202020] p-2 sm:p-4">
        <ResumePreview content={content} achievements={achievements} template={template} placeholder={placeholder} />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]" role="status" aria-live="polite">
            <div className="flex items-center gap-2 rounded-full bg-(--surface) px-4 py-2.5 text-sm font-medium text-(--ink) shadow-lg">
              <Loader2 size={16} className="animate-spin text-(--accent)" /> Building your resume…
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function ResumeBuilder() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEditing = Boolean(id);
  const resumeQuery = useResume(id);
  const resume = resumeQuery.data?.resume;
  const initialVersion = resumeQuery.data?.versions?.find(
    (version) => version._id === resume?.currentVersionId,
  );
  const fullVersionQuery = useFullVersion(id, resume?.currentVersionId);
  const createManual = useCreateManualResume();
  const generate = useGenerateResume();
  const updateManual = useUpdateManualResume(id);
  const [mode, setMode] = useState("manual");
  const [step, setStep] = useState(0);
  const [titleDraft, setTitleDraft] = useState(null);
  const [draftContent, setDraftContent] = useState(null);
  const [achievementsDraft, setAchievementsDraft] = useState(null);
  const [template, setTemplate] = useState("modern");
  const [skillsDraft, setSkillsDraft] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [background, setBackground] = useState("");
  const [aiTitle, setAiTitle] = useState("");
  const [generatedResult, setGeneratedResult] = useState(null);
  const [error, setError] = useState("");
  const pending = createManual.isPending || generate.isPending || updateManual.isPending;
  const initialContent = useMemo(
    () =>
      fullVersionQuery.data
        ? contentFromVersion(fullVersionQuery.data.parsedSections)
        : EMPTY_CONTENT,
    [fullVersionQuery.data],
  );
  const content = draftContent ?? initialContent;
  const achievements = achievementsDraft ?? initialContent._achievements ?? "";
  const title = titleDraft ?? resume?.title ?? "";

  function setContent(update) {
    setDraftContent((current) => {
      const base = current ?? initialContent;
      return typeof update === "function" ? update(base) : update;
    });
  }

  const apiContent = useMemo(
    () => toApiContent(content, achievements),
    [content, achievements],
  );
  const previewVersion = useMemo(
    () => ({ parsedSections: apiContent, label: "Preview", sourceType: "manual" }),
    [apiContent],
  );
  const aiPreviewContent = useMemo(
    () => generatedResult?.version?.parsedSections
      ? contentFromVersion(generatedResult.version.parsedSections)
      : createAiPreview(candidateName, targetRole, {
        email,
        phone,
        location,
        linkedInUrl,
        portfolioUrl,
      }),
    [candidateName, email, generatedResult, linkedInUrl, location, phone, portfolioUrl, targetRole],
  );
  const aiPreviewVersion = useMemo(
    () => ({
      parsedSections: toApiContent(aiPreviewContent, aiPreviewContent._achievements || ""),
      label: generatedResult?.version?.label || "Preview",
      sourceType: generatedResult?.version?.sourceType || "generated",
    }),
    [aiPreviewContent, generatedResult],
  );
  function updateBasics(key, value) {
    setContent((current) => ({
      ...current,
      basics: { ...current.basics, [key]: value },
    }));
  }

  function setTitle(value) {
    setTitleDraft(value);
  }

  function updateListItem(section, index, key, value) {
    setContent((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addListItem(section, item) {
    setContent((current) => ({ ...current, [section]: [...current[section], { ...item }] }));
  }

  function removeListItem(section, index) {
    setContent((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function updateLink(label, url) {
    setContent((current) => {
      const links = current.basics.links.filter((link) => link.label !== label);
      if (url.trim()) links.push({ label, url });
      return { ...current, basics: { ...current.basics, links } };
    });
  }

  function personalInfoError() {
    if (!title.trim()) return "Add a resume title to continue.";
    if (!content.basics.name.trim()) return "Add your name to continue.";
    if (content.basics.email && !/^\S+@\S+\.\S+$/.test(content.basics.email)) {
      return "Enter a valid email address.";
    }
    for (const link of content.basics.links) {
      try {
        if (link.url && !["http:", "https:"].includes(new URL(link.url).protocol)) {
          return "Portfolio and profile links must use http or https.";
        }
      } catch {
        return "Enter a complete profile URL, including https://.";
      }
    }
    return "";
  }

  function stepError() {
    if (step === 0) return personalInfoError();
    return "";
  }

  function goNext() {
    const message = stepError();
    setError(message);
    if (!message) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function saveManual() {
    const message = personalInfoError() || content.projects.some((project) => {
      if (!project.link) return false;
      try {
        return !["http:", "https:"].includes(new URL(project.link).protocol);
      } catch {
        return true;
      }
    }) && "Enter a complete project URL, including https://.";
    if (message) {
      setStep(0);
      setError(message);
      return;
    }
    if (!hasAnyContent(apiContent)) {
      setError("Add at least one resume section before saving.");
      return;
    }
    setError("");
    try {
      const result = isEditing
        ? await updateManual.mutateAsync({ title: title.trim(), content: apiContent })
        : await createManual.mutateAsync({ title: title.trim(), content: apiContent });
      if (result?.resume?._id) nav(`/resumes/${result.resume._id}`);
    } catch (requestError) {
      setError(requestError?.message || "We couldn't save this resume.");
    }
  }

  async function generateResume(event) {
    event.preventDefault();
    setError("");
    try {
      const result = await generate.mutateAsync({
        title: aiTitle.trim() || undefined,
        candidateName: candidateName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        linkedInUrl: linkedInUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        targetRole: targetRole.trim(),
        background: background.trim(),
      });
      if (!result?.resume?._id || !result?.version?.parsedSections) {
        throw new Error("Generation completed without resume content to preview.");
      }
      setGeneratedResult(result);
    } catch (requestError) {
      setError(requestError?.message || "Resume generation failed. Please try again.");
    }
  }

  if (isEditing && (resumeQuery.isLoading || fullVersionQuery.isLoading)) {
    return <Skeleton className="h-155 rounded-2xl" />;
  }

  if (isEditing && (resumeQuery.error || fullVersionQuery.error || !resume)) {
    return (
      <EmptyState
        icon={FileText}
        title="Couldn't open this resume"
        description={resumeQuery.error?.message || fullVersionQuery.error?.message || "Resume not found."}
        action={<Button variant="outline" onClick={() => nav("/resumes")}>Back to resumes</Button>}
      />
    );
  }

  if (isEditing && initialVersion?.versionNumber === 1 && initialVersion.sourceType !== "manual") {
    return (
      <EmptyState
        icon={FileText}
        title="This resume can't be edited here"
        description="The current API supports editing manually created resumes. Uploaded and AI-generated versions remain available for analysis and export."
        action={<Button variant="outline" onClick={() => nav(`/resumes/${id}`)}>Back to resume</Button>}
      />
    );
  }

  const currentStep = STEPS[step];
  const busyLabel = isEditing ? "Saving changes…" : "Saving resume…";

  return (
    <div className="space-y-5">
      <TemplateStyles />
      <PageHeader
        title={isEditing ? "Edit resume" : "Resume Builder"}
        description={isEditing ? `Editing ${resume?.title || "your resume"}` : "Build a polished, ATS-ready resume from scratch or with AI."}
        actions={
          <Button variant="ghost" onClick={() => nav(isEditing ? `/resumes/${id}` : "/resumes")}>
            <ArrowLeft size={15} /> <span className="hidden sm:inline">{isEditing ? "Resume" : "All resumes"}</span>
          </Button>
        }
      />

      {!isEditing && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => { setMode("manual"); setError(""); }}
            className={`flex min-h-21.5 items-center gap-4 rounded-2xl border px-5 text-left transition ${mode === "manual" ? "border-(--accent) bg-(--accent-soft)" : "border-(--border) bg-(--surface) hover:border-(--accent)/50"}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--surface) text-(--accent)"><FileText size={19} /></span>
            <span><span className="block text-sm font-semibold">Create Manually</span><span className="mt-1 block text-xs text-(--ink-muted)">Shape each section and preview as you go.</span></span>
            {mode === "manual" && <Check size={17} className="ml-auto text-(--accent)" />}
          </button>
          <button
            type="button"
            onClick={() => { setMode("ai"); setError(""); }}
            className={`flex min-h-21.5 items-center gap-4 rounded-2xl border px-5 text-left transition ${mode === "ai" ? "border-(--accent) bg-(--accent-soft)" : "border-(--border) bg-(--surface) hover:border-(--accent)/50"}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-(--surface) text-(--accent)"><Sparkles size={19} /></span>
            <span><span className="block text-sm font-semibold">Generate with AI</span><span className="mt-1 block text-xs text-(--ink-muted)">Turn your experience into a role-focused first draft.</span></span>
            {mode === "ai" && <Check size={17} className="ml-auto text-(--accent)" />}
          </button>
        </div>
      )}

      {mode === "ai" && !isEditing ? (
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(390px,1.08fr)]">
          <Card className="min-w-0" padding="lg">
            <form onSubmit={generateResume} className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--accent-soft) text-(--accent)"><Sparkles size={18} /></div>
                <div><h3 className="text-base font-semibold">Start with your experience</h3><p className="mt-1 text-xs leading-relaxed text-(--ink-muted)">Gemini will organize and polish details you provide. It should not invent employers, credentials, dates, or results.</p></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={candidateName} onChange={(event) => setCandidateName(event.target.value)} placeholder="Your full name" required minLength={1} maxLength={160} autoComplete="name" />
                <Field label="Target role" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Senior Product Designer" required minLength={2} maxLength={120} />
                <Field label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required maxLength={254} autoComplete="email" />
                <Field label="Phone number" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 555 0100" required maxLength={50} autoComplete="tel" />
                <Field label="Location (optional)" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, Region" maxLength={200} autoComplete="address-level2" />
                <Field label="LinkedIn profile URL (optional)" type="url" value={linkedInUrl} onChange={(event) => setLinkedInUrl(event.target.value)} placeholder="https://linkedin.com/in/you" maxLength={500} />
                <Field label="GitHub / Portfolio URL (optional)" type="url" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://github.com/you" maxLength={500} />
                <Field label="Resume title (optional)" value={aiTitle} onChange={(event) => setAiTitle(event.target.value)} placeholder="Product Designer Resume" maxLength={120} />
              </div>
              <Field label="Your background" value={background} onChange={(event) => setBackground(event.target.value)} multiline rows={10} placeholder="Include roles, dates, projects, education, skills, accomplishments, and any relevant metrics." required minLength={30} maxLength={12000} />
              {error && <div role="alert" className="rounded-xl border border-(--danger)/20 bg-(--danger)/10 px-3.5 py-3 text-sm text-(--danger)">{error}</div>}
              {generatedResult && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-(--accent)/20 bg-(--accent-soft) px-3.5 py-3">
                  <span className="text-xs font-medium text-(--accent-strong)">Saved as {generatedResult.resume.title}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => nav(`/resumes/${generatedResult.resume._id}`)}>Open resume <ArrowRight size={13} /></Button>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border) pt-4">
                <span className="text-xs text-(--ink-muted)">Your draft is saved as a new resume after generation.</span>
                <Button variant="accent" size="lg" type="submit" disabled={pending || !candidateName.trim() || !email.trim() || !phone.trim() || targetRole.trim().length < 2 || background.trim().length < 30}>
                  {pending ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Sparkles size={15} /> {generatedResult ? "Generate another draft" : "Generate resume"}</>}
                </Button>
              </div>
            </form>
          </Card>
          <ResumePreviewPane
            content={aiPreviewContent}
            achievements={aiPreviewContent._achievements || ""}
            template={template}
            onTemplateChange={setTemplate}
            version={aiPreviewVersion}
            title={generatedResult?.resume?.title || aiTitle || targetRole || "Resume preview"}
            placeholder={!generatedResult}
            loading={generate.isPending}
            onOpenSaved={generatedResult ? () => nav(`/resumes/${generatedResult.resume._id}`) : null}
          />
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(390px,1.08fr)]">
          <section className="min-w-0 space-y-4">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-(--border) px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--accent)">Step {step + 1} of {STEPS.length}</p><h3 className="mt-1 text-base font-semibold">{currentStep.title}</h3></div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--accent-soft) text-(--accent)"><currentStep.icon size={18} /></span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-1.5" aria-label="Builder progress">
                  {STEPS.map((item, index) => (
                    <button key={item.title} type="button" title={item.title} aria-label={`Go to ${item.title}`} onClick={() => { setStep(index); setError(""); }} className={`h-1.5 rounded-full transition-colors ${index <= step ? "bg-(--accent)" : "bg-(--surface-2)"}`} />
                  ))}
                </div>
                <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                  {STEPS.map((item, index) => (
                    <button key={item.title} type="button" onClick={() => { setStep(index); setError(""); }} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] transition ${index === step ? "bg-(--accent) text-white" : "text-(--ink-muted) hover:bg-(--surface-2)"}`}>{item.title}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-6">
                {step === 0 && (
                  <>
                    <Field label="Resume title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Software Engineer Resume" required maxLength={120} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full name" value={content.basics.name} onChange={(event) => updateBasics("name", event.target.value)} placeholder="Jordan Lee" autoComplete="name" required maxLength={160} />
                      <Field label="Professional title" value={content.basics.title} onChange={(event) => updateBasics("title", event.target.value)} placeholder="Software Engineer" maxLength={160} />
                      <Field label="Email" type="email" value={content.basics.email} onChange={(event) => updateBasics("email", event.target.value)} placeholder="jordan@example.com" autoComplete="email" maxLength={254} />
                      <Field label="Phone" type="tel" value={content.basics.phone} onChange={(event) => updateBasics("phone", event.target.value)} placeholder="+1 555 0100" autoComplete="tel" maxLength={50} />
                      <Field label="Location" value={content.basics.location} onChange={(event) => updateBasics("location", event.target.value)} placeholder="Austin, TX" maxLength={200} />
                      <Field label="LinkedIn URL" value={content.basics.links.find((link) => link.label === "LinkedIn")?.url || ""} onChange={(event) => updateLink("LinkedIn", event.target.value)} placeholder="https://linkedin.com/in/you" type="url" />
                    </div>
                    <Field label="Portfolio or GitHub URL" value={content.basics.links.find((link) => link.label === "Portfolio")?.url || ""} onChange={(event) => updateLink("Portfolio", event.target.value)} placeholder="https://your-site.com" type="url" />
                  </>
                )}

                {step === 1 && <Field label="Professional summary" value={content.summary} onChange={(event) => setContent((current) => ({ ...current, summary: event.target.value }))} multiline rows={8} placeholder="Write a concise overview of your experience, strengths, and the value you bring." maxLength={5000} />}

                {step === 2 && (
                  <DynamicSection
                    items={content.education}
                    emptyItem={EMPTY_EDUCATION}
                    onAdd={() => addListItem("education", EMPTY_EDUCATION)}
                    onRemove={(index) => removeListItem("education", index)}
                    label="Education"
                    addLabel="Add education"
                    renderItem={(item, index) => (
                      <EntryCard key={index} number={index + 1} onRemove={() => removeListItem("education", index)}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Degree" value={item.degree} onChange={(event) => updateListItem("education", index, "degree", event.target.value)} placeholder="B.S. Computer Science" maxLength={200} />
                          <Field label="School" value={item.school} onChange={(event) => updateListItem("education", index, "school", event.target.value)} placeholder="University name" maxLength={200} />
                          <Field label="Location" value={item.location} onChange={(event) => updateListItem("education", index, "location", event.target.value)} placeholder="City, State" maxLength={200} />
                          <Field label="Dates" value={item.period} onChange={(event) => updateListItem("education", index, "period", event.target.value)} placeholder="2020 — 2024" maxLength={120} />
                        </div>
                        <Field label="Details (one per line)" value={item.details.join("\n")} onChange={(event) => updateListItem("education", index, "details", linesToList(event.target.value))} multiline rows={3} placeholder="Honors, relevant coursework, GPA" />
                      </EntryCard>
                    )}
                  />
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div><p className="text-sm font-medium">Technical skills</p><p className="mt-1 text-xs text-(--ink-muted)">Add one skill at a time; keep them relevant to your target role.</p></div>
                    <div className="flex gap-2">
                      <Input value={skillsDraft} onChange={(event) => setSkillsDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} placeholder="Type a skill and press Enter" aria-label="Add a technical skill" />
                      <Button type="button" variant="outline" aria-label="Add skill" title="Add skill" onClick={addSkill}><Plus size={16} /></Button>
                    </div>
                    <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-dashed border-(--border) p-3">
                      {content.skills.length ? content.skills.map((skill, index) => <span key={`${skill}-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-(--accent-soft) px-3 py-1.5 text-xs text-(--accent-strong)">{skill}<button type="button" onClick={() => setContent((current) => ({ ...current, skills: current.skills.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={`Remove ${skill}`} className="rounded-full p-0.5 hover:bg-(--accent)/10"><Trash2 size={12} /></button></span>) : <span className="text-xs text-(--ink-muted)">Your skills will appear here.</span>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Languages (comma-separated)" value={content.languages.join(", ")} onChange={(event) => setContent((current) => ({ ...current, languages: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="English, Spanish" />
                      <Field label="Interests (comma-separated)" value={content.interests.join(", ")} onChange={(event) => setContent((current) => ({ ...current, interests: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="Open source, mentoring" />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <DynamicSection items={content.experience} emptyItem={EMPTY_EXPERIENCE} onAdd={() => addListItem("experience", EMPTY_EXPERIENCE)} onRemove={(index) => removeListItem("experience", index)} label="Work experience" addLabel="Add experience" renderItem={(item, index) => (
                    <EntryCard key={index} number={index + 1} onRemove={() => removeListItem("experience", index)}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Role" value={item.role} onChange={(event) => updateListItem("experience", index, "role", event.target.value)} placeholder="Senior Engineer" maxLength={200} />
                        <Field label="Company" value={item.company} onChange={(event) => updateListItem("experience", index, "company", event.target.value)} placeholder="Company name" maxLength={200} />
                        <Field label="Location" value={item.location} onChange={(event) => updateListItem("experience", index, "location", event.target.value)} placeholder="Remote · New York, NY" maxLength={200} />
                        <Field label="Dates" value={item.period} onChange={(event) => updateListItem("experience", index, "period", event.target.value)} placeholder="Jan 2022 — Present" maxLength={120} />
                      </div>
                      <Field label="Impact bullets (one per line)" value={item.bullets.join("\n")} onChange={(event) => updateListItem("experience", index, "bullets", linesToList(event.target.value))} multiline rows={5} placeholder="Led a project that improved..." />
                    </EntryCard>
                  )} />
                )}

                {step === 5 && (
                  <DynamicSection items={content.projects} emptyItem={EMPTY_PROJECT} onAdd={() => addListItem("projects", EMPTY_PROJECT)} onRemove={(index) => removeListItem("projects", index)} label="Projects" addLabel="Add project" renderItem={(item, index) => (
                    <EntryCard key={index} number={index + 1} onRemove={() => removeListItem("projects", index)}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Project name" value={item.name} onChange={(event) => updateListItem("projects", index, "name", event.target.value)} placeholder="Project name" maxLength={200} />
                        <Field label="Project URL" value={item.link} onChange={(event) => updateListItem("projects", index, "link", event.target.value)} placeholder="https://github.com/..." type="url" maxLength={500} />
                      </div>
                      <Field label="Description" value={item.description} onChange={(event) => updateListItem("projects", index, "description", event.target.value)} multiline rows={3} placeholder="What it does and what you contributed." maxLength={2000} />
                      <Field label="Tools and technologies (comma-separated)" value={item.tech.join(", ")} onChange={(event) => updateListItem("projects", index, "tech", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} placeholder="React, Node.js, MongoDB" />
                    </EntryCard>
                  )} />
                )}

                {step === 6 && (
                  <DynamicSection items={content.certifications} emptyItem={{ name: "", issuer: "", year: "" }} onAdd={() => addListItem("certifications", { name: "", issuer: "", year: "" })} onRemove={(index) => removeListItem("certifications", index)} label="Certifications" addLabel="Add certification" renderItem={(item, index) => (
                    <EntryCard key={index} number={index + 1} onRemove={() => removeListItem("certifications", index)}>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Certification" value={item.name} onChange={(event) => updateListItem("certifications", index, "name", event.target.value)} placeholder="AWS Certified..." maxLength={200} />
                        <Field label="Issuer" value={item.issuer} onChange={(event) => updateListItem("certifications", index, "issuer", event.target.value)} placeholder="Amazon Web Services" maxLength={200} />
                        <Field label="Year" value={item.year} onChange={(event) => updateListItem("certifications", index, "year", event.target.value)} placeholder="2025" maxLength={20} />
                      </div>
                    </EntryCard>
                  )} />
                )}

                {step === 7 && <Field label="Achievements (one per line)" value={achievements} onChange={(event) => setAchievementsDraft(event.target.value)} multiline rows={8} placeholder="Awards, measurable wins, publications, or leadership contributions." hint="Achievements are stored in the supported summary field and displayed separately in the preview and PDF." maxLength={4000} />}

                {error && <div role="alert" className="rounded-xl border border-(--danger)/20 bg-(--danger)/10 px-3.5 py-3 text-sm text-(--danger)">{error}</div>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border) px-5 py-4 sm:px-6">
                <Button type="button" variant="ghost" disabled={step === 0 || pending} onClick={() => { setStep((current) => current - 1); setError(""); }}><ArrowLeft size={14} /> Previous</Button>
                {step < STEPS.length - 1 ? (
                  <Button type="button" variant="accent" onClick={goNext}>Next step <ArrowRight size={14} /></Button>
                ) : (
                  <Button type="button" variant="accent" onClick={saveManual} disabled={pending}>
                    {pending ? <><Loader2 size={14} className="animate-spin" /> {busyLabel}</> : <><Check size={14} /> {isEditing ? "Save changes" : "Save resume"}</>}
                  </Button>
                )}
              </div>
            </Card>
          </section>

          <ResumePreviewPane
            content={content}
            achievements={achievements}
            template={template}
            onTemplateChange={setTemplate}
            version={previewVersion}
            title={title || "Resume"}
          />
        </div>
      )}
    </div>
  );

  function addSkill() {
    const skill = skillsDraft.trim();
    if (!skill) return;
    if (!content.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setContent((current) => ({ ...current, skills: [...current.skills, skill] }));
    }
    setSkillsDraft("");
  }
}

function hasAnyContent(content) {
  return Boolean(
    content.basics.name || content.basics.email || content.basics.title || content.summary ||
      content.experience.length || content.education.length || content.skills.length ||
      content.projects.length || content.certifications.length || content.languages.length ||
      content.interests.length,
  );
}

function DynamicSection({ items, onAdd, label, addLabel, renderItem }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-(--ink-muted)">{items.length ? `${items.length} item${items.length === 1 ? "" : "s"}` : "Optional. Add only what strengthens your resume."}</p></div>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}><Plus size={14} /> {addLabel}</Button>
      </div>
      {items.length ? items.map(renderItem) : (
        <button type="button" onClick={onAdd} className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-(--border) text-xs text-(--ink-muted) transition hover:border-(--accent)/50 hover:text-(--accent)">
          <Plus size={17} /> Add your first {label.toLowerCase().replace(/s$/, "")}
        </button>
      )}
    </div>
  );
}

function EntryCard({ number, onRemove, children }) {
  return (
    <div className="space-y-4 rounded-xl border border-(--border) bg-(--surface-2) p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-(--ink-muted)">Entry {number}</span>
        <button type="button" onClick={onRemove} title="Remove entry" aria-label={`Remove entry ${number}`} className="flex h-8 w-8 items-center justify-center rounded-full text-(--ink-muted) transition hover:bg-(--danger)/10 hover:text-(--danger)"><Trash2 size={14} /></button>
      </div>
      {children}
    </div>
  );
}