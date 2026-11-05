const ApiError = require("../utils/ApiError");
const Analysis = require("../models/Analysis");
const Resume = require("../models/Resume");
const ResumeVersion = require("../models/ResumeVersion");
const { analyzeResume } = require("./geminiService");

const MIN_ANALYSIS_TEXT_LENGTH = 50;

async function createAnalysis({ userId, resume, version, targetRole }) {
  const rawText = version.rawText?.trim();
  if (!rawText || rawText.length < MIN_ANALYSIS_TEXT_LENGTH) {
    throw ApiError.badRequest(
      "Resume version does not contain enough readable text to analyze",
    );
  }

  const { analysis, model, promptTokens, responseTokens } = await analyzeResume({
    rawText,
    targetRole,
  });

  const saved = await Analysis.create({
    userId,
    resumeId: resume._id,
    versionId: version._id,
    atsScore: analysis.atsScore,
    scoreBreakdown: analysis.scoreBreakdown,
    scores: analysis.scores,
    scoreRationale: analysis.scoreRationale,
    issues: analysis.issues,
    strengths: analysis.strengths.map((strength) => ({
      ...strength,
      explanation: strength.evidence,
    })),
    bulletRewrites: analysis.bulletRewrites,
    weakBulletPoints: analysis.weakBulletPoints,
    keywordsPresent: analysis.keywordsPresent,
    keywordsMissing: analysis.keywordsMissing,
    missingSkills: analysis.missingSkills,
    missingKeywords: analysis.keywordsMissing,
    grammarIssues: analysis.grammarIssues,
    suggestions: analysis.suggestions,
    sectionAnalysis: analysis.sectionAnalysis,
    summary: analysis.summary,
    scoreDisclaimer:
      "ATS compatibility scores are estimates based on the provided resume text and are not guaranteed results from any specific ATS.",
    model,
    promptTokens,
    responseTokens,
  });

  version.latestAnalysisId = saved._id;
  await version.save();

  return saved;
}

async function findOwnedResume(userId, resumeId) {
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) throw ApiError.notFound("Resume not found");
  return resume;
}

async function findResumeVersion(resume, versionId) {
  const resolvedVersionId = versionId || resume.currentVersionId;
  if (!resolvedVersionId) {
    throw ApiError.badRequest("No version is available to analyze");
  }

  const version = await ResumeVersion.findOne({
    _id: resolvedVersionId,
    resumeId: resume._id,
  });
  if (!version) throw ApiError.notFound("Resume version not found");
  return version;
}

module.exports = {
  createAnalysis,
  findOwnedResume,
  findResumeVersion,
};
