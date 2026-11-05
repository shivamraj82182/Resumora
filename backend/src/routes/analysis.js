const express = require("express");
const { z } = require("zod");
const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { analyzeLimiter } = require("../middleware/rateLimit");
const analysisController = require("../controllers/analysisController");

const router = express.Router();
router.use(requireAuth);

const objectIdSchema = z.string().refine(mongoose.isValidObjectId, {
  message: "Invalid id",
});

const createAnalysisBody = z.object({
  resumeId: objectIdSchema,
  versionId: objectIdSchema.optional(),
  targetRole: z.string().trim().max(120).optional(),
});

const listQuery = z.object({
  resumeId: objectIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.post(
  "/",
  analyzeLimiter,
  validate(createAnalysisBody),
  asyncHandler(analysisController.create),
);

router.get(
  "/",
  validate(listQuery, "query"),
  asyncHandler(analysisController.list),
);

router.get(
  "/history",
  validate(listQuery, "query"),
  asyncHandler(analysisController.history),
);

module.exports = router;
