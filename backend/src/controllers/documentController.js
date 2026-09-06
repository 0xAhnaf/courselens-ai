const pdfParse = require("pdf-parse");

exports.extractText = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No document file uploaded." });
  }

  const { originalname, mimetype, buffer } = req.file;

  try {
    let extractedText = "";
    let pageCount = 1;

    if (mimetype === "application/pdf" || originalname.endsWith(".pdf")) {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text ? parsed.text.trim() : "";
      pageCount = parsed.numpages || 1;
    } else {
      extractedText = buffer.toString("utf-8").trim();
    }

    if (!extractedText || extractedText.length < 10) {
      return res.status(400).json({
        error: "Readable text could not be extracted from this document. OCR is currently unsupported."
      });
    }

    res.json({
      file_name: originalname,
      text: extractedText,
      page_count: pageCount
    });
  } catch (err) {
    res.status(500).json({ error: "Document processing failed: " + err.message });
  }
};