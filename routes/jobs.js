const express = require("express");
const router = express.Router();
const { Job, Candidate } = require("../models");

router.get("/", async (req, res) => {
  const jobs = await Job.findAll();
  res.json(jobs);
});

router.post("/create", async (req, res) => {
  const { team, position, jd, custom_questions, team_lead_email } = req.body;

  const job = await Job.create({ team, position, jd, custom_questions, team_lead_email });

  job.form_link = `http://localhost:5173/form/${job.id}`;
  job.sheet_link = `https://globalbees1-my.sharepoint.com/:f:/g/personal/ankit_patil_urbangabru_in/Eqo3LNyHplxAlqMalY4SBwIBpul1h4AGM0Knw5p_fmbj3A?e=cza1sw/${job.id}.xlsx`;

  await job.save();

  // ✅ RELOAD from DB before sending
  const updatedJob = await Job.findByPk(job.id, { raw: true }); // returns plain object
  console.log("Created Job with Form Link:", updatedJob); // helpful log
  res.json(updatedJob);
});

router.get("/:id", async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  const candidates = await Candidate.findAll({ where: { jobId: job.id } });
  res.json({ job, candidates });
});

router.post("/close/:id", async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  job.status = "closed";
  await job.save();
  res.json({ success: true });
});

module.exports = router;
