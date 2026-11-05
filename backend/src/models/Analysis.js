const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    explanation: String,
    fix: String,
  },
  { _id: false },
);

const strengthSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    evidence: String,
    explanation: String,
  },
  { _id: false },
);

const grammarIssueSchema = new mongoose.Schema(
  {
    original: { type: String, required: true },
    correction: { type: String, required: true },
    explanation: String,
  },
  { _id: false },
);

const bulletRewriteSchema = new mongoose.Schema(
  {
    section: String,
    original: { type: String, required: true },
    rewritten: { type: String, required: true },
    rationale: String,
  },
  { _id: true },
);

const weakBulletPointSchema = new mongoose.Schema(
  {
    section: { type: String, required: true },
    original: { type: String, required: true },
    weakness: { type: String, required: true },
    suggestion: { type: String, required: true },
  },
  { _id: false },
);

const sectionFeedbackSchema = new mongoose.Schema(
  {
    findings: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
  },
  { _id: false },
);

const sectionAnalysisSchema = new mongoose.Schema(
  {
    summary: { type: sectionFeedbackSchema, default: () => ({}) },
    education: { type: sectionFeedbackSchema, default: () => ({}) },
    skills: { type: sectionFeedbackSchema, default: () => ({}) },
    projects: { type: sectionFeedbackSchema, default: () => ({}) },
    experience: { type: sectionFeedbackSchema, default: () => ({}) },
  },
  { _id: false },
);

const scoreBreakdownSchema = new mongoose.Schema(
  {
    keywords: { type: Number, min: 0, max: 25 },
    formatting: { type: Number, min: 0, max: 25 },
    impact: { type: Number, min: 0, max: 25 },
    clarity: { type: Number, min: 0, max: 25 },
  },
  { _id: false },
);

const scoresSchema = new mongoose.Schema(
  {
    technicalSkills: { type: Number, min: 0, max: 100 },
    formatting: { type: Number, min: 0, max: 100 },
    keywords: { type: Number, min: 0, max: 100 },
    experience: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const scoreRationaleSchema = new mongoose.Schema(
  {
    technicalSkills: String,
    formatting: String,
    keywords: String,
    experience: String,
  },
  { _id: false },
);

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
      index: true,
    },

    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResumeVersion",
      required: true,
      index: true,
    },
    atsScore: { type: Number, min: 0, max: 100, required: true },
    scoreBreakdown: scoreBreakdownSchema,
    scores: scoresSchema,
    scoreRationale: scoreRationaleSchema,
    issues: { type: [issueSchema], default: [] },
    strengths: { type: [strengthSchema], default: [] },
    bulletRewrites: { type: [bulletRewriteSchema], default: [] },
    weakBulletPoints: { type: [weakBulletPointSchema], default: [] },
    keywordsPresent: { type: [String], default: [] },
    keywordsMissing: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    grammarIssues: { type: [grammarIssueSchema], default: [] },
    suggestions: { type: [String], default: [] },
    sectionAnalysis: { type: sectionAnalysisSchema, default: () => ({}) },
    summary: { type: String, default: "" },
    scoreDisclaimer: { type: String, default: "" },

    model: { type: String, required: true },
    promptTokens: Number,
    responseTokens: Number,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Analysis", analysisSchema);
