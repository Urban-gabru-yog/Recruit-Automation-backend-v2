const express = require("express");
const router = express.Router();
const { Job, Candidate } = require("../models");

// GET /api/candidates/held - Get all held candidates with their job info
router.get('/held', async (req, res) => {
  try {
    const heldCandidates = await Candidate.findAll({
      where: { hr_status: 'hold' },
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'team', 'position', 'status'],
          required: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Add original job info to each candidate for easier frontend handling
    const candidatesWithJobInfo = heldCandidates.map(candidate => ({
      ...candidate.toJSON(),
      originalTeam: candidate.job.team,
      originalPosition: candidate.job.position,
      originalJobId: candidate.job.id,
      originalJobStatus: candidate.job.status
    }));

    res.json(candidatesWithJobInfo);
  } catch (error) {
    console.error('Get held candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch held candidates' });
  }
});

// GET /api/candidates/available-jobs/:team - Get available jobs for a specific team
router.get('/available-jobs/:team', async (req, res) => {
  try {
    const { team } = req.params;
    
    const availableJobs = await Job.findAll({
      where: { 
        team: team,
        status: 'open', // Only show open jobs
        hidden: false   // Only show non-hidden jobs
      },
      attributes: ['id', 'team', 'position', 'status', 'form_link'],
      order: [['createdAt', 'DESC']]
    });

    res.json(availableJobs);
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch available jobs' });
  }
});

// POST /api/candidates/move-to-job - Move candidate to different job
router.post('/move-to-job', async (req, res) => {
  try {
    const { candidateId, newJobId, hr_status = 'shortlisted' } = req.body;
    
    // Validate inputs
    if (!candidateId || !newJobId) {
      return res.status(400).json({ 
        error: 'candidateId and newJobId are required' 
      });
    }

    // Find the candidate
    const candidate = await Candidate.findByPk(candidateId, {
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['team', 'position']
        }
      ]
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Find the target job
    const targetJob = await Job.findByPk(newJobId);
    if (!targetJob) {
      return res.status(404).json({ error: 'Target job not found' });
    }

    // Verify that the target job is from the same team (security check)
    if (candidate.job.team !== targetJob.team) {
      return res.status(400).json({ 
        error: 'Cannot move candidate to a different team' 
      });
    }

    // Store original job info for logging
    const originalJobInfo = {
      jobId: candidate.jobId,
      team: candidate.job.team,
      position: candidate.job.position
    };

    // Update candidate's job and status
    candidate.jobId = newJobId;
    candidate.hr_status = hr_status;
    await candidate.save();

    console.log(`✅ Candidate ${candidate.name} moved from ${originalJobInfo.position} to ${targetJob.position} (${targetJob.team})`);

    res.json({ 
      success: true, 
      message: `Candidate moved to ${targetJob.position} and marked as ${hr_status}`,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        newJobId: newJobId,
        newJobPosition: targetJob.position,
        hr_status: hr_status
      }
    });

  } catch (error) {
    console.error('Move candidate error:', error);
    res.status(500).json({ error: 'Failed to move candidate' });
  }
});

// GET /api/candidates/by-team/:team - Get all candidates for a specific team (useful for analytics)
router.get('/by-team/:team', async (req, res) => {
  try {
    const { team } = req.params;
    
    const candidates = await Candidate.findAll({
      include: [
        {
          model: Job,
          as: 'job',
          where: { team: team },
          attributes: ['id', 'team', 'position', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(candidates);
  } catch (error) {
    console.error('Get candidates by team error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

module.exports = router;
