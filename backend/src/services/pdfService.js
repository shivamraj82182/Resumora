const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const path = require("path");
const ApiError = require("../utils/ApiError");

const MIN_READABLE_TEXT_LENGTH = 50;

async function extractResumeText(buffer, fileName) {
  const extension = path.extname(fileName || "").toLowerCase();
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw ApiError.badRequest("Uploaded resume file is empty");
  }

  let text;
  let meta;

  if (extension === ".pdf") {
    let result;
    try {
      result = await pdf(buffer);
    } catch {
      throw ApiError.badRequest("Failed to parse PDF file");
    }

    text = (result.text || "").trim();
    meta = { numPages: result.numpages, format: "pdf" };
  } else if (extension === ".docx") {
    let result;
    try {
      result = await mammoth.extractRawText({ buffer });
    } catch {
      throw ApiError.badRequest("Failed to parse DOCX file");
    }

    text = (result.value || "").trim();
    meta = { format: "docx" };
  } else {
    throw ApiError.badRequest("Unsupported resume format; upload a PDF or DOCX file");
  }

  if (text.length < MIN_READABLE_TEXT_LENGTH) {
    throw ApiError.badRequest(
      "Could not extract enough readable text from the resume"
    );
  }

  return { text, meta };
}

module.exports = {
  extractResumeText,
};