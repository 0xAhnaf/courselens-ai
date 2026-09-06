const path = require("path");
const multer = require("multer");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = {
  ".pdf": new Set(["application/pdf", "application/octet-stream"]),
  ".txt": new Set(["text/plain", "application/octet-stream"]),
  ".docx": new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream"
  ])
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = String(file.mimetype || "").toLowerCase();
    const acceptedMimeTypes = allowedMimeTypes[extension];

    if (!acceptedMimeTypes || !acceptedMimeTypes.has(mimeType)) {
      const error = new Error("Only PDF, DOCX, and TXT documents are supported.");
      error.code = "UNSUPPORTED_DOCUMENT_TYPE";
      return callback(error);
    }

    return callback(null, true);
  }
}).single("file");

exports.documentUpload = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Document exceeds the 5 MB file-size limit." });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: `Document upload failed: ${error.message}` });
    }

    return res.status(400).json({ error: error.message || "Document upload failed." });
  });
};
