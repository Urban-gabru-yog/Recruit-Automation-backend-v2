const cron = require("node-cron");
const { Candidate, Job, sequelize } = require("../models");
const axios = require("axios");
require("dotenv").config();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

async function scorePendingCandidates() {
  console.log("⏰ Cron running: resume scoring job started");

  try {
    await sequelize.authenticate();

    const candidates = await Candidate.findAll({
      where: {
        ats_score: null,
        status: 'pending',
      },
      limit: 10,
    });

    if (candidates.length === 0) {
      console.log("✅ No pending candidates found.");
      return;
    }

    for (const candidate of candidates) {
      try {
        const job = await Job.findByPk(candidate.jobId);
        if (!job) {
          console.warn(`⚠️ Job not found for candidate ID ${candidate.id} (jobId = ${candidate.jobId})`);
          continue;
        }

        if (!candidate.resume_url || !candidate.resume_url.startsWith("http")) {
          console.warn(`❌ Invalid resume_url for ${candidate.email}: ${candidate.resume_url}`);
          continue;
        }

        await axios.post(N8N_WEBHOOK_URL, {
          resume_url: candidate.resume_url,
          jd: job.jd,
          name: candidate.name,
          email: candidate.email,
          willing_to_relocate: candidate.custom_answers?.["Willing to relocate to Pune"] || "Error",
        });

        console.log(`✅ Candidate ${candidate.email} sent to n8n`);
      } catch (err) {
        console.error(`❌ Error scoring ${candidate.email}:`, err.message);
      }
    }

    console.log("✅ Scoring batch complete.");
  } catch (err) {
    console.error("❌ Cron fatal error:", err.message);
  }
}

// Schedule: every 10 seconds (for testing)
// Change to  "0 */2 * * *" for every 2 hours in production
cron.schedule("0 */2 * * *", async () => {
  await scorePendingCandidates();
});
