const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { Candidate } = require("../models");
const { uploadToOneDrive } = require("../services/storage");


// ✅ Use in-memory storage so we can access req.file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/submit", upload.single("resume"), async (req, res) => {
  try {
    // const { name, email, phone, job_id, team, position, ...custom } = req.body;
    const { name, email, phone, job_id, team, position, ...rest } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    const buffer = req.file.buffer;
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const mimeType = req.file.mimetype;

    const resumeUrl = await uploadToOneDrive(buffer, fileName, mimeType);
    console.log("Resume uploaded to:", resumeUrl);

    const customAnswers = {};
    Object.keys(rest).forEach((key) => {
      if (key.startsWith("custom_")) {
        const label = key.replace("custom_", "");
        customAnswers[label] = rest[key];
      }
    });

    console.log("Saving candidate with phone:", phone);


    await Candidate.create({
      name,
      email,
      phone,
      jobId: job_id,
      resume_url: resumeUrl,
      status: "pending",
      custom_answers: customAnswers,
    });

    res.json({ success: true, resume_url: resumeUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Submission failed" });
  }
});

router.post("/update-status/:id", async (req, res) => {
  try {
    const { status, hr_status } = req.body;
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });

    if (status) candidate.status = status;
    if (hr_status) candidate.hr_status = hr_status;

    await candidate.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
