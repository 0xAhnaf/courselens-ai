const path = require("path");
const { PDFParse } = require("pdf-parse");

const MAX_EXTRACTED_CHARACTERS = 250000;

const extractionTooLarge = (res) =>
  res.status(413).json({
    error: `Extracted text exceeds the ${MAX_EXTRACTED_CHARACTERS.toLocaleString("en-US")} character limit.`
  });

exports.extractText = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No document file uploaded." });
  }

  const { originalname, buffer } = req.file;
  const extension = path.extname(originalname).toLowerCase();

  try {
    let extractedText = "";
    let pageCount = 1;

    if (extension === ".pdf") {
      if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        return res.status(400).json({ error: "The uploaded file is not a valid PDF document." });
      }

      const parser = new PDFParse({ data: buffer });

      try {
        const parsed = await parser.getText();
        extractedText = parsed.text ? parsed.text.trim() : "";
        pageCount = parsed.total || 1;
      } finally {
        await parser.destroy();
      }
    } else {
      if (buffer.includes(0)) {
        return res.status(400).json({ error: "The uploaded TXT file contains unsupported binary data." });
      }

      extractedText = buffer.toString("utf-8").trim();
    }

    if (!extractedText || extractedText.length < 10) {
      return res.status(400).json({
        error: "Readable text could not be extracted from this document. OCR is currently unsupported."
      });
    }

    if (extractedText.length > MAX_EXTRACTED_CHARACTERS) {
      return extractionTooLarge(res);
    }

    res.json({
      file_name: originalname,
      text: extractedText,
      page_count: pageCount
    });
  } catch (err) {
    console.error("Document extraction failed:", err.message);
    return res.status(400).json({ error: "The document could not be processed. It may be damaged or password-protected." });
  }
};
