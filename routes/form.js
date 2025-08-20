// routes/form.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { Candidate } = require("../models");
const { uploadToOneDrive } = require("../services/storage");

// In-memory storage + 2 MB limit + allowed types
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB hard limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type. Upload PDF/DOC/DOCX."));
    }
    cb(null, true);
  },
});

// slug helper for clean filenames
const slug = (s) =>
  (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

// Multer wrapper so we can send friendly messages
const handleUpload = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      if (err.message?.includes("Unsupported file type")) {
        return res.status(400).json({ error: "Please upload a PDF/DOC/DOCX." });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large. Max allowed size is 2 MB." });
      }
      return res.status(400).json({ error: "Upload failed. Try again." });
    }
    next();
  });
};

router.post("/submit", handleUpload, async (req, res) => {
  try {
    const { name, email, phone, job_id, team, position, ...rest } = req.body;
    if (!req.file) return res.status(400).json({ error: "No resume file uploaded" });

    // Rename -> name-position-YYYYMMDD-HHmmss.ext
    const base = `${slug(name)}-${slug(position)}`.replace(/^-+|-+$/g, "") || "resume";
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14); // YYYYMMDDHHmmss
    const ext = path.extname(req.file.originalname) || ".pdf";
    const safeFileName = `${base}-${ts}${ext}`;

    const resumeUrl = await uploadToOneDrive(req.file.buffer, safeFileName, req.file.mimetype);
    if (!resumeUrl) {
      // IMPORTANT: do NOT create the candidate on upload failure
      return res.status(502).json({ error: "Resume upload failed. Please try again." });
    }

    // collect custom_ answers
    const customAnswers = {};
    Object.keys(rest).forEach((key) => {
      if (key.startsWith("custom_")) {
        const label = key.replace("custom_", "");
        customAnswers[label] = rest[key];
      }
    });

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

// POST /api/form/update-interview-status/:id - Update interview status for candidates
router.post('/update-interview-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { interview_status } = req.body;
    
    // Validate interview status
    if (!['scheduled', 'taken'].includes(interview_status)) {
      return res.status(400).json({ 
        error: 'Invalid interview status. Must be "scheduled" or "taken"' 
      });
    }
    
    // Find and update candidate
    const candidate = await Candidate.findByPk(id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Update interview status
    candidate.interview_status = interview_status;
    await candidate.save();
    
    console.log(`✅ Interview status updated for ${candidate.name}: ${interview_status}`);
    
    res.json({ 
      success: true, 
      message: `Interview status updated to ${interview_status}`,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        interview_status: interview_status
      }
    });
    
  } catch (error) {
    console.error('Update interview status error:', error);
    res.status(500).json({ error: 'Failed to update interview status' });
  }
});

module.exports = router;



// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const router = express.Router();
// const { Candidate } = require("../models");
// const { uploadToOneDrive } = require("../services/storage");
// const axios = require("axios");
// const { Job } = require("../models");


// // ✅ Use in-memory storage so we can access req.file.buffer
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// router.post("/submit", upload.single("resume"), async (req, res) => {
//   try {
//     // const { name, email, phone, job_id, team, position, ...custom } = req.body;
//     const { name, email, phone, job_id, team, position, ...rest } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ error: "No resume file uploaded" });
//     }

//     const buffer = req.file.buffer;
//     const fileName = `${Date.now()}_${req.file.originalname}`;
//     const mimeType = req.file.mimetype;

//     const resumeUrl = await uploadToOneDrive(buffer, fileName, mimeType);
//     console.log("Resume uploaded to:", resumeUrl);

//     const customAnswers = {};
//     Object.keys(rest).forEach((key) => {
//       if (key.startsWith("custom_")) {
//         const label = key.replace("custom_", "");
//         customAnswers[label] = rest[key];
//       }
//     });

//     console.log("Saving candidate with phone:", phone);


//     await Candidate.create({
//       name,
//       email,
//       phone,
//       jobId: job_id,
//       resume_url: resumeUrl,
//       status: "pending",
//       custom_answers: customAnswers,
//     });

//     res.json({ success: true, resume_url: resumeUrl });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ error: "Submission failed" });
//   }
// });

// router.post("/update-status/:id", async (req, res) => {
//   try {
//     const { status, hr_status } = req.body;
//     const candidate = await Candidate.findByPk(req.params.id);
//     if (!candidate)
//       return res.status(404).json({ error: "Candidate not found" });

//     if (status) candidate.status = status;
//     if (hr_status) candidate.hr_status = hr_status;

//     await candidate.save();
//     res.json({ success: true });
//   } catch (err) {
//     console.error("Status update error:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = router;
