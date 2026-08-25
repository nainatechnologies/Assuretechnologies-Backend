const express = require('express');
const router = express.Router();
const careerController = require('./career.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const createUpload = require('../../middleware/upload');

const uploadResume = createUpload('resumes');

// ===================== PUBLIC ROUTES =====================
// Anyone can view jobs and submit applications
router.get('/jobs', careerController.getAllJobs);
router.get('/jobs/:id', careerController.getJobById);
router.post('/jobs/:id/apply', uploadResume.single('resume'), careerController.submitApplication);

// ===================== ADMIN ONLY ROUTES =====================
router.use(authMiddleware(['admin']));
router.post('/jobs', careerController.createJob);
router.put('/jobs/:id', careerController.updateJob);
router.delete('/jobs/:id', careerController.deleteJob);

// Admin views and manages applications
router.get('/applications', careerController.getAllApplications);
router.get('/applications/:id', careerController.getApplicationById);
router.patch('/applications/:id/status', careerController.updateApplicationStatus);

module.exports = router;
