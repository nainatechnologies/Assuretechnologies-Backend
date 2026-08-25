const asyncHandler = require('../../utils/asyncHandler');
const { createJobSchema, updateJobSchema, submitApplicationSchema, updateApplicationStatusSchema } = require('./career.validation');
const AppError = require('../../utils/AppError');
const careerService = require('./career.service');

// ===================== JOB POSTINGS =====================

exports.getAllJobs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';

  const result = await careerService.getAllJobs({ page, limit, search });

  res.status(200).json({ 
    success: true, 
    message: 'Jobs fetched successfully', 
    ...result
  });
});

exports.getJobById = asyncHandler(async (req, res) => {
  const job = await careerService.getJobById(req.params.id);
  res.status(200).json({ success: true, message: 'Job fetched successfully', data: job });
});

exports.createJob = asyncHandler(async (req, res) => {
  const result = createJobSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map(e => e.message).join(', ');
    throw new AppError(messages, 400);
  }
  
  const job = await careerService.createJob(result.data);
  res.status(201).json({ success: true, message: 'Job posted successfully', data: job });
});

exports.updateJob = asyncHandler(async (req, res) => {
  const result = updateJobSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map(e => e.message).join(', ');
    throw new AppError(messages, 400);
  }

  const job = await careerService.updateJob(req.params.id, result.data);
  res.status(200).json({ success: true, message: 'Job updated successfully', data: job });
});

exports.deleteJob = asyncHandler(async (req, res) => {
  await careerService.deleteJob(req.params.id);
  res.status(200).json({ success: true, message: 'Job deleted successfully', data: null });
});

// ===================== APPLICATIONS =====================

exports.submitApplication = asyncHandler(async (req, res) => {
  const result = submitApplicationSchema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map(e => e.message).join(', ');
    throw new AppError(messages, 400);
  }

  const application = await careerService.submitApplication(result.data, req.file);
  res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
});

exports.getAllApplications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';
  const status = req.query.status;

  const result = await careerService.getAllApplications({ page, limit, search, status });

  res.status(200).json({ 
    success: true, 
    message: 'Applications fetched successfully', 
    ...result
  });
});

exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await careerService.getApplicationById(req.params.id);
  res.status(200).json({ success: true, message: 'Application fetched', data: application });
});

exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const result = updateApplicationStatusSchema.safeParse(req.body);
  if (!result.success) throw new AppError(result.error.issues[0].message, 400);

  const application = await careerService.updateApplicationStatus(req.params.id, result.data.status);
  res.status(200).json({ success: true, message: 'Application status updated', data: application });
});
