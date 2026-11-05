const { GoogleGenAI, Type } = require("@google/genai");
const { z } = require("zod");

const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const { resumeContentSchema, sanitizeProjectLinks } = require("./resumeContent");

const ai = env.geminiApiKey
  ? new GoogleGenAI({
      apiKey: env.geminiApiKey,
    })
  : null;

const responseSchema = {
  type: Type.OBJECT,
  required: [
    "atsScore",
    "scoreBreakdown",
    "scores",
    "scoreRationale",
    "issues",
    "strengths",
    "bulletRewrites",
    "weakBulletPoints",
    "keywordsPresent",
    "keywordsMissing",
    "missingSkills",
    "grammarIssues",
    "suggestions",
    "sectionAnalysis",
    "summary",
  ],

  properties: {
    atsScore: {
      type: Type.NUMBER,
      description: "ATS-readiness score from 0 to 100",
    },

    scoreBreakdown: {
      type: Type.OBJECT,
      required: ["keywords", "formatting", "impact", "clarity"],
      properties: {
        keywords: { type: Type.NUMBER, description: "0-25" },
        formatting: { type: Type.NUMBER, description: "0-25" },
        impact: { type: Type.NUMBER, description: "0-25" },
        clarity: { type: Type.NUMBER, description: "0-25" },
      },
    },

    scores: {
      type: Type.OBJECT,
      required: ["technicalSkills", "formatting", "keywords", "experience"],
      properties: {
        technicalSkills: { type: Type.NUMBER, description: "0-100 estimate" },
        formatting: { type: Type.NUMBER, description: "0-100 estimate" },
        keywords: { type: Type.NUMBER, description: "0-100 estimate" },
        experience: { type: Type.NUMBER, description: "0-100 estimate" },
      },
    },

    scoreRationale: {
      type: Type.OBJECT,
      required: ["technicalSkills", "formatting", "keywords", "experience"],
      properties: {
        technicalSkills: { type: Type.STRING },
        formatting: { type: Type.STRING },
        keywords: { type: Type.STRING },
        experience: { type: Type.STRING },
      },
    },

    issues: {
      type: Type.ARRAY,
      description: "Evidence-based findings; empty if none are supported",
      items: {
        type: Type.OBJECT,
        required: ["title", "severity", "explanation", "fix"],
        properties: {
          title: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            enum: ["low", "medium", "high"],
          },
          explanation: { type: Type.STRING },
          fix: { type: Type.STRING },
        },
      },
    },

    strengths: {
      type: Type.ARRAY,
      description: "Strengths supported by explicit evidence in the resume",
      items: {
        type: Type.OBJECT,
        required: ["title", "evidence"],
        properties: {
          title: { type: Type.STRING },
          evidence: { type: Type.STRING },
        },
      },
    },

    bulletRewrites: {
      type: Type.ARRAY,
      description: "Optional rewrites for weak bullets present in the resume",
      items: {
        type: Type.OBJECT,
        required: ["section", "original", "rewritten", "rationale"],
        properties: {
          section: { type: Type.STRING },
          original: { type: Type.STRING },
          rewritten: { type: Type.STRING },
          rationale: { type: Type.STRING },
        },
      },
    },

    weakBulletPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["section", "original", "weakness", "suggestion"],
        properties: {
          section: { type: Type.STRING },
          original: { type: Type.STRING },
          weakness: { type: Type.STRING },
          suggestion: { type: Type.STRING },
        },
      },
    },

    grammarIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["original", "correction", "explanation"],
        properties: {
          original: { type: Type.STRING },
          correction: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
      },
    },

    keywordsPresent: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },

    keywordsMissing: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },

    missingSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },

    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },

    sectionAnalysis: {
      type: Type.OBJECT,
      required: ["summary", "education", "skills", "projects", "experience"],
      properties: Object.fromEntries(
        ["summary", "education", "skills", "projects", "experience"].map(
          (section) => [
            section,
            {
              type: Type.OBJECT,
              required: ["findings", "suggestions"],
              properties: {
                findings: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          ],
        ),
      ),
    },

    summary: {
      type: Type.STRING,
      description: "One short paragraph overall verdict",
    },
  },
};

const analysisValidator = z.object({
  atsScore: z.number().min(0).max(100),

  scoreBreakdown: z.object({
    keywords: z.number().min(0).max(25),
    formatting: z.number().min(0).max(25),
    impact: z.number().min(0).max(25),
    clarity: z.number().min(0).max(25),
  }),

  scores: z.object({
    technicalSkills: z.number().min(0).max(100),
    formatting: z.number().min(0).max(100),
    keywords: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
  }),

  scoreRationale: z.object({
    technicalSkills: z.string(),
    formatting: z.string(),
    keywords: z.string(),
    experience: z.string(),
  }),

  issues: z
    .array(
      z.object({
        title: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        explanation: z.string(),
        fix: z.string(),
      })
    ),

  strengths: z
    .array(
      z.object({
        title: z.string(),
        evidence: z.string(),
      })
    ),

  bulletRewrites: z
    .array(
      z.object({
        section: z.string(),
        original: z.string(),
        rewritten: z.string(),
        rationale: z.string(),
      })
    )
    .default([]),

  weakBulletPoints: z
    .array(
      z.object({
        section: z.string(),
        original: z.string(),
        weakness: z.string(),
        suggestion: z.string(),
      }),
    )
    .default([]),

  grammarIssues: z
    .array(
      z.object({
        original: z.string(),
        correction: z.string(),
        explanation: z.string(),
      }),
    )
    .default([]),

  keywordsPresent: z.array(z.string()).default([]),
  keywordsMissing: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  sectionAnalysis: z.object({
    summary: z.object({
      findings: z.array(z.string()),
      suggestions: z.array(z.string()),
    }),
    education: z.object({
      findings: z.array(z.string()),
      suggestions: z.array(z.string()),
    }),
    skills: z.object({
      findings: z.array(z.string()),
      suggestions: z.array(z.string()),
    }),
    projects: z.object({
      findings: z.array(z.string()),
      suggestions: z.array(z.string()),
    }),
    experience: z.object({
      findings: z.array(z.string()),
      suggestions: z.array(z.string()),
    }),
  }),
  summary: z.string(),
});

const generatedResumeResponseSchema = {
  type: Type.OBJECT,
  required: [
    "basics",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
    "interests",
  ],
  properties: {
    basics: {
      type: Type.OBJECT,
      required: ["name", "title", "location", "email", "phone", "links"],
      properties: {
        name: { type: Type.STRING },
        title: { type: Type.STRING },
        location: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        links: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["label", "url"],
            properties: {
              label: { type: Type.STRING },
              url: { type: Type.STRING },
            },
          },
        },
      },
    },
    summary: { type: Type.STRING },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["company", "role", "location", "period", "bullets"],
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          location: { type: Type.STRING },
          period: { type: Type.STRING },
          bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["degree", "school", "location", "period", "details"],
        properties: {
          degree: { type: Type.STRING },
          school: { type: Type.STRING },
          location: { type: Type.STRING },
          period: { type: Type.STRING },
          details: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name", "description", "tech", "link"],
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          tech: { type: Type.ARRAY, items: { type: Type.STRING } },
          link: { type: Type.STRING },
        },
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name", "issuer", "year"],
        properties: {
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
          year: { type: Type.STRING },
        },
      },
    },
    languages: { type: Type.ARRAY, items: { type: Type.STRING } },
    interests: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
};

function buildPrompt({ rawText, targetRole }) {
  return [
    "You are a senior technical recruiter and ATS expert reviewing a resume.",

    targetRole
      ? `Target role: ${targetRole}.`
      : "No specific target role was provided; assess only what is evident from the resume.",

    "",
    "All scores are estimates based solely on the supplied resume text; they are not guaranteed ATS outcomes. Score atsScore from 0 to 100 and technicalSkills, formatting, keywords, and experience separately from 0 to 100. Give concise evidence-based rationale for each score.",
    "Assess formatting only from text structure, headings, and ordering. The original visual layout cannot be verified from extracted text.",
    "Do not invent, infer, or claim qualifications, experience, skills, achievements, metrics, employers, education, or credentials that are not stated in the resume.",
    "Missing skills and keywords are suggestions to consider only when truthful for the candidate; do not imply the candidate has them.",
    "Return prioritized issues, evidence-backed strengths, grammar/spelling issues, weak bullets, actionable suggestions, and findings plus suggestions for Summary, Education, Skills, Projects, and Experience. For absent sections, say the section is not present.",
    "Any bullet rewrite or suggestion must preserve meaning and must not add unsupported facts or numbers. Quote the original bullet exactly.",
    "List only keywords clearly present as present and identify possible target-role keywords as missing.",
    "The sectionAnalysis and scoreRationale must cite only evidence from the resume text.",
    "",
    "RESUME TEXT:",
    "------------",
    rawText,
    "------------",
  ].join("\n");
}

async function callGemini(prompt, responseFormat = responseSchema) {
  const result = await ai.models.generateContent({
    model: env.geminiModel,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseFormat,
      temperature: 0.4,
    },
  });

  const text =
    typeof result.text === "function" ? result.text() : result.text;

  if (!text) throw new Error("Empty response from Gemini");

  return {
    text,
    usage: result.usageMetadata || {},
  };
}

async function analyzeResume({ rawText, targetRole }) {
  if (!ai) throw ApiError.internal("Gemini API key is not configured on the server");

  const prompt = buildPrompt({ rawText, targetRole });

  let lastErr;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { text, usage } = await callGemini(prompt);

      const parsed = JSON.parse(text);
      const validated = analysisValidator.parse(parsed);

      return {
        analysis: validated,
        model: env.geminiModel,
        promptTokens: usage.promptTokenCount,
        responseTokens: usage.candidatesTokenCount,
      };
    } catch (err) {
      lastErr = err;
      if (attempt === 2) break;
    }
  }

  console.error("Gemini analysis failed:", lastErr);
  if (lastErr instanceof SyntaxError || lastErr?.name === "ZodError") {
    throw new ApiError(502, "Gemini returned an invalid analysis response");
  }
  throw new ApiError(502, "Gemini analysis service failed");
}

async function generateResumeContent({
  background,
  candidateName,
  email,
  phone,
  location,
  linkedInUrl,
  portfolioUrl,
  targetRole,
}) {
  if (!ai) throw ApiError.internal("Gemini_API_key not configured on the server");

  const prompt = [
    "You are a professional resume writer. Create ATS-friendly resume content for the requested target role using only facts in the candidate background.",
    "Improve clarity and wording, but do not invent employers, education, dates, credentials, links, skills, achievements, or numerical results.",
    "Only add a project link when that exact URL is explicitly associated with that project in the candidate background. Never reuse personal contact URLs as project links.",
    "Do not infer personal contact details. Leave unavailable fields empty and omit unsupported experience or education entries.",
    `Candidate full name: ${candidateName}`,
    "Use the supplied contact details exactly as provided; do not infer, invent, rewrite, or omit any contact values.",
    "Return the requested structured JSON. Keep experience and education in reverse chronological order when dates are available.",
    `Target role: ${targetRole}`,
    "CONTACT DETAILS (copy exactly; do not alter or add values):",
    `Full name: ${candidateName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Location: ${location || "Not provided"}`,
    `LinkedIn URL: ${linkedInUrl || "Not provided"}`,
    `GitHub / Portfolio URL: ${portfolioUrl || "Not provided"}`,
    "CANDIDATE BACKGROUND:",
    "--------------------",
    background,
    "--------------------",
  ].join("\n");

  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { text } = await callGemini(prompt, generatedResumeResponseSchema);
      const generated = JSON.parse(text);
      const links = [linkedInUrl, portfolioUrl].filter(Boolean);
      return resumeContentSchema.parse({
        ...generated,
        basics: {
          ...generated.basics,
          name: candidateName,
          email,
          phone,
          location,
          links: [
            ...(linkedInUrl ? [{ label: "LinkedIn", url: linkedInUrl }] : []),
            ...(portfolioUrl
              ? [{ label: "GitHub / Portfolio", url: portfolioUrl }]
              : []),
          ],
        },
        projects: sanitizeProjectLinks(generated.projects || [], background, links),
      });
    } catch (err) {
      lastErr = err;
      if (attempt === 2) break;
    }
  }

  throw ApiError.internal(
    `Gemini resume generation failed: ${lastErr?.message || "unknown error"}`,
  );
}

module.exports = { analyzeResume, generateResumeContent };