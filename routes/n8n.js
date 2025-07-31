const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Candidate, Job } = require("../models");


router.post("/generate-jd", async (req, res) => {
  try {
    const { team, position, responsibilities, skills, experience, location } =
      req.body;

    const n8nRes = await axios.post(
      "https://workflows.gb1.in/webhook/jd-generator",
      {
        team,
        position,
        responsibilities,
        skills,
        experience,
        location,
      }
    );

    console.log("✅ JD webhook response from n8n:", n8nRes.data);

    let jdText = "";

    // Handle multiple formats
    if (typeof n8nRes.data === "string") {
      jdText = n8nRes.data;
    } else if (n8nRes.data.jd) {
      jdText = n8nRes.data.jd;
    } else if (Array.isArray(n8nRes.data) && n8nRes.data[0]?.payload?.jd) {
      jdText = n8nRes.data[0].payload.jd;
    } else {
      throw new Error("JD not found in webhook response");
    }

    res.json({ jd: jdText });
  } catch (err) {
    console.error(
      "❌ JD generation failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to generate JD" });
  }
});

// ✅ Receive final JD back from n8n
router.post("/jd-complete", async (req, res) => {
  try {
    const { team, position, jd } = req.body;

    if (!team || !position || !jd) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("✅ JD received from n8n:", { team, position });
    console.log(jd); // Log full JD

    // 📝 If you want to insert into DB later, add Job.create({ ... }) here

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error receiving JD:", err.message);
    res.status(500).json({ error: "Failed to receive JD" });
  }
});

// ✅ Score Candidates in n8n:
router.post("/score-candidates", async (req, res) => {
  const pendingCandidates = await Candidate.findAll({
    where: { status: "pending" },
  });

  for (const candidate of pendingCandidates) {
    const job = await Job.findByPk(candidate.jobId);
    if (!job) continue;

    const response = await axios.post(
      "https://workflows.gb1.in/webhook/ats-score",
      {
        resume_url: candidate.resume_url,
        jd: job.jd,
        name: candidate.name,
        email: candidate.email,
        willing_to_relocate: candidate.custom_answers?.["Willing to relocate to Pune"]?.trim() || "Not specified"
      }
    );

    const { ats_score, summary, reason, status } = response.data;

    await candidate.update({
      ats_score,
      summary,
      shortlisting_reason: reason,
      status, // 'shortlisted' or 'rejected'
    });
  }

  res.json({ success: true });
});

module.exports = router;
