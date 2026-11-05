const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { uploadResume } = require("../middleware/upload");

const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");

const { analyzeLimiter, generateLimiter } = require("../middleware/rateLimit");
const Analysis = require("../models/Analysis");
const {
  generateResumeContent,
} = require("../services/geminiService");

const { diffText, summarize } = require("../services/diffService");

const { extractResumeText } = require("../services/pdfService");
const { parseResume: parseStructure } = require("../services/structureParser");
const { resumeContentSchema, toResumeText } = require("../services/resumeContent");
const { createAnalysis } = require("../services/analysisService");

const router = express.Router();
router.use(requireAuth);

const objectIdSchema = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v), { message: "Invalid id" });

const idParam = z.object({ id: objectIdSchema });

const manualCreateBody = z.object({
  title: z.string().trim().min(1).max(120),
  content: resumeContentSchema,
});

const manualUpdateBody = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  content: resumeContentSchema,
});

const profileUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
    } catch {
      return false;
    }
  }, { message: "Enter a valid http or https URL" })
  .default("");

const generateBody = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  candidateName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(1).max(50),
  location: z.string().trim().max(200).optional().default(""),
  linkedInUrl: profileUrlSchema,
  portfolioUrl: profileUrlSchema,
  targetRole: z.string().trim().min(2).max(120),
  background: z.string().trim().min(30).max(12000),
});

function hasResumeContent(content) {
  const {
    basics,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    interests,
  } = content;
  return Boolean(
    basics.name || basics.email || basics.title || basics.links.length || summary ||
      experience.length || education.length || skills.length || projects.length ||
      certifications.length || languages.length || interests.length,
  );
}

async function createResumeWithVersion({ userId, title, content, sourceType }) {
  if (!hasResumeContent(content)) {
    throw ApiError.badRequest("Resume content must include at least one populated section");
  }

  const rawText = toResumeText(content);
  const resume = await Resume.create({
    userId,
    title,
    latestVersionNumber: 1,
  });
  const version = await ResumeVersion.create({
    resumeId: resume._id,
    versionNumber: 1,
    label: "V1",
    rawText,
    parsedSections: content,
    sourceType,
    parentVersionId: null,
  });

  resume.currentVersionId = version._id;
  await resume.save();
  return { resume, version };
}

async function loadOwnedResume(req) {
  const resume = await Resume.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!resume) throw ApiError.notFound("Resume not found");
  return resume;
}

async function loadVersion(resumeId, versionId) {
  const version = await ResumeVersion.findOne({ _id: versionId, resumeId });
  if (!version) throw ApiError.notFound("Version not found");
  return version;
}

router.post(
  "/",
  uploadResume("file"),
  asyncHandler(async (req, res) => {
    const { text, meta } = await extractResumeText(
      req.file.buffer,
      req.file.originalname,
    );
    const parsedSections = await parseStructure(text);

    const title =
      (req.body.title || "").trim() ||
      req.file.originalname.replace(/\.(pdf|docx)$/i, "") ||
      "Untitled Resume";

    const resume = await Resume.create({
      userId: req.user._id,
      title,
      latestVersionNumber: 1,
    });

    const version = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: 1,
      label: "V1",
      rawText: text,
      parsedSections,
      sourceType: "upload",
      parentVersionId: null,
    });

    resume.currentVersionId = version._id;
    await resume.save();

    res.status(201).json({ resume, version, meta });
  }),
);

router.post(
  "/manual",
  validate(manualCreateBody),
  asyncHandler(async (req, res) => {
    const result = await createResumeWithVersion({
      userId: req.user._id,
      title: req.body.title,
      content: req.body.content,
      sourceType: "manual",
    });
    res.status(201).json(result);
  }),
);

router.post(
  "/generate",
  generateLimiter,
  validate(generateBody),
  asyncHandler(async (req, res) => {
    const content = await generateResumeContent({
      background: req.body.background,
      candidateName: req.body.candidateName,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      linkedInUrl: req.body.linkedInUrl,
      portfolioUrl: req.body.portfolioUrl,
      targetRole: req.body.targetRole,
    });
    const title = (
      req.body.title || `${content.basics.name || req.body.targetRole} Resume`
    ).slice(0, 120);
    const result = await createResumeWithVersion({
      userId: req.user._id,
      title,
      content,
      sourceType: "generated",
    });
    res.status(201).json(result);
  }),
);

router.put(
  "/:id/manual",
  validate(idParam, "params"),
  validate(manualUpdateBody),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);
    const originalVersion = await ResumeVersion.findOne({
      resumeId: resume._id,
      versionNumber: 1,
      sourceType: "manual",
    });
    if (!originalVersion) {
      throw ApiError.badRequest("Only manually created resumes can be edited here");
    }
    if (!hasResumeContent(req.body.content)) {
      throw ApiError.badRequest("Resume content must include at least one populated section");
    }

    const parentVersion = resume.currentVersionId
      ? await loadVersion(resume._id, resume.currentVersionId)
      : originalVersion;
    const nextNumber = resume.latestVersionNumber + 1;
    const version = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: nextNumber,
      label: `v${nextNumber}`,
      rawText: toResumeText(req.body.content),
      parsedSections: req.body.content,
      sourceType: "manual",
      parentVersionId: parentVersion._id,
    });

    if (req.body.title) resume.title = req.body.title;
    resume.latestVersionNumber = nextNumber;
    resume.currentVersionId = version._id;
    await resume.save();

    res.json({ resume, version });
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ resumes });
  }),
);

router.get(
  "/:id",
  validate(idParam, "params"),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);

    const versions = await ResumeVersion.find({ resumeId: resume._id })
      .sort({ versionNumber: 1 })
      .select("-rawText")
      .lean();

    res.json({ resume, versions });
  }),
);

router.get(
  "/:id/versions/:versionId",
  validate(
    z.object({ id: objectIdSchema, versionId: objectIdSchema }),
    "params",
  ),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);
    const version = await loadVersion(resume._id, req.params.versionId);

    res.json({ version });
  }),
);

router.delete(
  "/:id",
  validate(idParam, "params"),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);

    await ResumeVersion.deleteMany({ resumeId: resume._id });
    await Analysis.deleteMany({ resumeId: resume._id });
    await resume.deleteOne();

    res.json({ ok: true });
  }),
);

const analyzeBody = z.object({
  versionId: objectIdSchema.optional(),
  targetRole: z.string().trim().max(120).optional(),
});

router.post(
  "/:id/analyze",
  analyzeLimiter,
  validate(idParam, "params"),
  validate(analyzeBody),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);

    const versionId = req.body.versionId || resume.currentVersionId;
    if (!versionId) throw ApiError.badRequest("No version to analyze");

    const version = await loadVersion(resume._id, versionId);

    const saved = await createAnalysis({
      userId: req.user._id,
      resume,
      version,
      targetRole: req.body.targetRole,
    });

    res.status(201).json({ analysis: saved });
  }),
);

router.get(
  "/:id/analyses",
  validate(idParam, "params"),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);

    const analyses = await Analysis.find({ resumeId: resume._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ analyses });
  }),
);

router.get(
  "/:id/versions/:versionId/analysis",
  validate(
    z.object({ id: objectIdSchema, versionId: objectIdSchema }),
    "params",
  ),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);

    const version = await loadVersion(resume._id, req.params.versionId);

    const analysis = await Analysis.findOne({
      resumeId: resume._id,
      versionId: version._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ analysis: analysis || null });
  }),
);

const rewriteBody = z.object({
  analysisId: objectIdSchema,
  rewriteIds: z.array(objectIdSchema).optional(),
  label: z.string().trim().max(40).optional(),
});

function applyRewritesToText(rawText, rewrites) {
  let result = rawText;

  for (const r of rewrites) {
    if (!r.original || !r.rewritten) continue;

    const idx = result.indexOf(r.original);

    if (idx >= 0) {
      result =
        result.slice(0, idx) +
        r.rewritten +
        result.slice(idx + r.original.length);
    } else {
      // Fallback: append as a strengthened alternative line
      result += `\n${r.rewritten}`;
    }
  }

  return result;
}

function patchBulletsInSections(sections, rewrites) {
  if (!sections) return null;

  const cloned = JSON.parse(JSON.stringify(sections));

  for (const r of rewrites) {
    if (!r.original || !r.rewritten) continue;

    for (const exp of cloned.experience || []) {
      if (!Array.isArray(exp.bullets)) continue;

      exp.bullets = exp.bullets.map((b) =>
        b === r.original ? r.rewritten : b
      );
    }
  }

  return cloned;
}

function looksEmpty(sections) {
  if (!sections) return true;

  const b = sections.basics || {};

  const hasIdentity = b.name || b.email || b.title;

  const hasBody =
    sections.summary ||
    sections.experience?.length ||
    sections.education?.length ||
    sections.skills?.length;

  return !hasIdentity && !hasBody;
}

router.post(
  "/:id/rewrite",
  validate(idParam, "params"),
  validate(rewriteBody),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);

    const analysis = await Analysis.findOne({
      _id: req.body.analysisId,
      resumeId: resume._id,
    });

    if (!analysis) throw ApiError.notFound("Analysis not found");

    const baseVersion = await loadVersion(resume._id, analysis.versionId);

    const selected = req.body.rewriteIds?.length
      ? analysis.bulletRewrites.filter((r) =>
          req.body.rewriteIds.includes(r._id.toString())
        )
      : analysis.bulletRewrites;

    if (!selected.length) {
      throw ApiError.badRequest("No rewrites selected to apply");
    }

    const newRaw = applyRewritesToText(baseVersion.rawText, selected);

    // Safety net: pre-build a structured copy from the base version with the
    // chosen bullets swapped in, so V2 never lands with empty sections even if
    // Gemini's re-parse fails.
    const patchedFromBase = patchBulletsInSections(
      baseVersion.parsedSections,
      selected
    );

    const reparsed = await parseStructure(newRaw);
    const finalParsed = looksEmpty(reparsed) ? patchedFromBase : reparsed;

    const nextNumber = resume.latestVersionNumber + 1;

    const newVersion = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: nextNumber,
      label: req.body.label?.trim() || `v${nextNumber}`,
      rawText: newRaw,
      parsedSections: finalParsed,
      sourceType: "rewrite",
      parentVersionId: baseVersion._id,
    });

    resume.latestVersionNumber = nextNumber;
    resume.currentVersionId = newVersion._id;
    await resume.save();

    res.status(201).json({
      version: newVersion,
      appliedCount: selected.length,
    });
  })
);

const diffQuery = z.object({
  from: objectIdSchema,
  to: objectIdSchema,
  mode: z.enum(["words", "lines"]).optional(),
});

router.get(
  "/:id/diff",
  validate(idParam, "params"),
  validate(diffQuery, "query"),
  asyncHandler(async (req, res) => {
    const resume = await loadOwnedResume(req);

    const [fromV, toV] = await Promise.all([
      loadVersion(resume._id, req.query.from),
      loadVersion(resume._id, req.query.to),
    ]);

    const parts = diffText(
      fromV.rawText,
      toV.rawText,
      req.query.mode
    );

    res.json({
      from: {
        id: fromV._id,
        label: fromV.label,
        versionNumber: fromV.versionNumber,
      },
      to: {
        id: toV._id,
        label: toV.label,
        versionNumber: toV.versionNumber,
      },
      parts,
      stats: summarize(parts),
    });
  })
);

module.exports = router;
