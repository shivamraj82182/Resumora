const Analysis = require("../models/Analysis");
const {
  createAnalysis,
  findOwnedResume,
  findResumeVersion,
} = require("../services/analysisService");

async function create(req, res) {
  const resume = await findOwnedResume(req.user._id, req.body.resumeId);
  const version = await findResumeVersion(resume, req.body.versionId);
  const analysis = await createAnalysis({
    userId: req.user._id,
    resume,
    version,
    targetRole: req.body.targetRole,
  });

  res.status(201).json({ analysis });
}

async function list(req, res) {
  const { resumeId, page, limit } = req.query;
  const filter = { userId: req.user._id };

  if (resumeId) {
    await findOwnedResume(req.user._id, resumeId);
    filter.resumeId = resumeId;
  }

  const [analyses, total] = await Promise.all([
    Analysis.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Analysis.countDocuments(filter),
  ]);

  res.json({
    analyses,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function history(req, res) {
  return list(req, res);
}

module.exports = { create, list, history };
