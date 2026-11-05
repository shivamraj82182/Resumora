const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const allowedTypes = new Map([
    ['.pdf', 'application/pdf'],
    ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const expectedMimeType = allowedTypes.get(extension);
        const isGenericMimeType = file.mimetype === 'application/octet-stream';

        if (
            !expectedMimeType ||
            (file.mimetype !== expectedMimeType && !isGenericMimeType)
        ) {
            return cb(ApiError.badRequest('Only PDF and DOCX files are allowed'));
        }
        cb(null, true);
    }
});

const uploadResume =
  (field = "file") =>
  (req, res, next) => {
    upload.single(field)(req, res, (err) => {

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(ApiError.badRequest("Resume file exceeds 5MB limit"));
        }
        return next(ApiError.badRequest(err.message));
      }

      if (err) return next(err);

      if (!req.file) {
        return next(ApiError.badRequest("No file uploaded"));
      }

      next();
    });
  };

module.exports = { uploadResume };