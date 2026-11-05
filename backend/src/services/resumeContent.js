const { z } = require("zod");

const text = (max = 2000) => z.string().trim().max(max).default("");
const textList = (maxItems = 40, maxText = 500) =>
  z.array(z.string().trim().min(1).max(maxText)).max(maxItems).default([]);

const resumeContentSchema = z.object({
  basics: z
    .object({
      name: text(160),
      title: text(160),
      location: text(200),
      email: z.string().trim().email().max(254).or(z.literal("")).default(""),
      phone: text(50),
      links: z
        .array(
          z.object({
            label: text(80),
            url: z.string().trim().url().max(500).or(z.literal("")).default(""),
          }),
        )
        .max(20)
        .default([]),
    })
    .default({}),
  summary: text(5000),
  experience: z
    .array(
      z.object({
        company: text(200),
        role: text(200),
        location: text(200),
        period: text(120),
        bullets: textList(30, 2000),
      }),
    )
    .max(30)
    .default([]),
  education: z
    .array(
      z.object({
        degree: text(200),
        school: text(200),
        location: text(200),
        period: text(120),
        details: textList(20, 1000),
      }),
    )
    .max(20)
    .default([]),
  skills: textList(100, 100),
  projects: z
    .array(
      z.object({
        name: text(200),
        description: text(2000),
        tech: textList(30, 100),
        link: z.string().trim().url().max(500).or(z.literal("")).default(""),
      }),
    )
    .max(30)
    .default([]),
  certifications: z
    .array(
      z.object({
        name: text(200),
        issuer: text(200),
        year: text(20),
      }),
    )
    .max(30)
    .default([]),
  languages: textList(30, 100),
  interests: textList(30, 100),
});

function normalizedHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const candidate = value.trim().replace(/[.,;!?]+$/, "");
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return null;

    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return null;
    }

    const searchHosts = new Set([
      "google.com",
      "www.google.com",
      "bing.com",
      "www.bing.com",
      "search.yahoo.com",
      "duckduckgo.com",
      "www.duckduckgo.com",
    ]);
    if (
      searchHosts.has(hostname) &&
      (url.pathname.toLowerCase().includes("search") || url.searchParams.has("q"))
    ) {
      return null;
    }

    const pathname = url.pathname.replace(/\/+$/, "");
    return {
      key: `${url.protocol}//${url.host.toLowerCase()}${pathname}${url.search}${url.hash}`,
      value: candidate,
    };
  } catch {
    return null;
  }
}

function sanitizeProjectLinks(projects, background, contactUrls) {
  const explicitUrls = new Set(
    [...background.matchAll(/https?:\/\/[^\s<>"'`]+/gi)]
      .map(([url]) => normalizedHttpUrl(url)?.key)
      .filter(Boolean),
  );
  const personalUrls = new Set(
    contactUrls.map((url) => normalizedHttpUrl(url)?.key).filter(Boolean),
  );

  return projects.map((project) => {
    const projectUrl = normalizedHttpUrl(project.link);
    const isExplicitProjectUrl =
      projectUrl && explicitUrls.has(projectUrl.key) && !personalUrls.has(projectUrl.key);
    return { ...project, link: isExplicitProjectUrl ? projectUrl.value : "" };
  });
}

function toResumeText(content) {
  const sections = resumeContentSchema.parse(content);
  const lines = [];
  const add = (value) => {
    if (value) lines.push(value);
  };
  const addSection = (heading, entries) => {
    const present = entries.filter(Boolean);
    if (!present.length) return;
    lines.push("", heading, ...present);
  };

  add(sections.basics.name);
  add(sections.basics.title);
  add(
    [
      sections.basics.location,
      sections.basics.email,
      sections.basics.phone,
      ...sections.basics.links.map((link) => link.url),
    ]
      .filter(Boolean)
      .join(" | "),
  );
  addSection("Summary", [sections.summary]);
  addSection(
    "Experience",
    sections.experience.flatMap((item) => [
      [item.role, item.company, item.location, item.period]
        .filter(Boolean)
        .join(" | "),
      ...item.bullets.map((bullet) => `- ${bullet}`),
    ]),
  );
  addSection(
    "Education",
    sections.education.flatMap((item) => [
      [item.degree, item.school, item.location, item.period]
        .filter(Boolean)
        .join(" | "),
      ...item.details,
    ]),
  );
  addSection("Skills", [sections.skills.join(", ")]);
  addSection(
    "Projects",
    sections.projects.flatMap((item) => [
      item.name,
      item.description,
      item.tech.join(", "),
      item.link,
    ]),
  );
  addSection(
    "Certifications",
    sections.certifications.map((item) =>
      [item.name, item.issuer, item.year].filter(Boolean).join(" | "),
    ),
  );
  addSection("Languages", [sections.languages.join(", ")]);
  addSection("Interests", [sections.interests.join(", ")]);

  return lines.join("\n").trim();
}

module.exports = { resumeContentSchema, sanitizeProjectLinks, toResumeText };