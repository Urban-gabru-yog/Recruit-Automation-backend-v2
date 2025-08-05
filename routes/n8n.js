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
    const { email, ats_score, summary, reason, status } = req.body;

    if (!email || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const candidate = await Candidate.findOne({ where: { email } });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    await candidate.update({
      ats_score,
      summary,
      shortlisting_reason: reason,
      status,
    });

    console.log(`✅ Resume scored: ${email} (${status})`);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Resume score update failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
