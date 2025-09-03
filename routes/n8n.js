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

// ✅ Receive scored candidate data from n8n
router.post("/resume-score-complete", async (req, res) => {
  try {
    const { candidate_id, email, ats_score, summary, reason, status } = req.body;

    // ✅ Prioritize candidate_id over email for precise updates
    if (!candidate_id && !email) {
      return res.status(400).json({ error: "candidate_id or email is required" });
    }

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    let candidate;
    
    if (candidate_id) {
      // ✅ Use candidate ID for precise lookup (recommended)
      candidate = await Candidate.findByPk(candidate_id);
      if (!candidate) {
        return res.status(404).json({ error: `Candidate with ID ${candidate_id} not found` });
      }
    } else {
      // ✅ Fallback to email (legacy support, but will only update first match)
      candidate = await Candidate.findOne({ where: { email } });
      if (!candidate) {
        return res.status(404).json({ error: `Candidate with email ${email} not found` });
      }
      console.warn(`⚠️ Using email fallback for candidate lookup. Consider using candidate_id for precision.`);
    }

    await candidate.update({
      ats_score,
      summary,
      shortlisting_reason: reason,
      status,
    });

    console.log(`✅ Resume scored: ID ${candidate.id} - ${candidate.email} (${status})`);

    res.json({ 
      success: true, 
      candidateId: candidate.id,
      email: candidate.email,
      status: status
    });
  } catch (err) {
    console.error("❌ Resume score update failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
