const { JobPosting, JobApplication } = require('./career.model');
const AppError = require('../../utils/AppError');
const { Op } = require('sequelize');

exports.getAllJobs = async ({ page, limit, search }) => {
  const offset = (page - 1) * limit;
  const whereClause = search ? {
    [Op.or]: [
      { title: { [Op.like]: `%${search}%` } },
      { jobCode: { [Op.like]: `%${search}%` } }
    ]
  } : {};

  const { count, rows } = await JobPosting.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    data: rows,
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  };
};

exports.getJobById = async (id) => {
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  const job = isUUID ? await JobPosting.findByPk(id) : await JobPosting.findOne({ where: { jobCode: id } });
  if (!job) throw new AppError('Job not found', 404);
  return job;
};

exports.createJob = async (data) => {
  if (!data.postedDate) data.postedDate = new Date().toISOString().split('T')[0];
  const job = await JobPosting.create(data);
  return job;
};

exports.updateJob = async (id, data) => {
  const job = await JobPosting.findByPk(id);
  if (!job) throw new AppError('Job not found', 404);
  await job.update(data);
  return job;
};

exports.deleteJob = async (id) => {
  const job = await JobPosting.findByPk(id);
  if (!job) throw new AppError('Job not found', 404);
  await job.destroy();
  return null;
};

exports.submitApplication = async (data, file) => {
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(data.jobId);
  const job = isUUID ? await JobPosting.findByPk(data.jobId) : await JobPosting.findOne({ where: { jobCode: data.jobId } });
  
  if (job) data.jobId = job.id;
  if (!job) throw new AppError('Job posting not found', 404);

  let resumeUrl = null;
  if (file) {
    resumeUrl = '/uploads/resumes/' + file.filename;
  }

  const application = await JobApplication.create({ ...data, resumeUrl });
  return application;
};

exports.getAllApplications = async ({ page, limit, search, status }) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (search) {
    whereClause[Op.or] = [
      { applicantName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { '$job.title$': { [Op.like]: `%${search}%` } }
    ];
  }
  
  if (status) {
    whereClause.status = { [Op.in]: status.split(',') };
  }

  const { count, rows } = await JobApplication.findAndCountAll({
    where: whereClause,
    include: [{ model: JobPosting, as: 'job', attributes: ['id', 'title'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    data: rows,
    total: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page
  };
};

exports.getApplicationById = async (id) => {
  const application = await JobApplication.findByPk(id, {
    include: [{ model: JobPosting, as: 'job', attributes: ['id', 'title'] }],
  });
  if (!application) throw new AppError('Application not found', 404);
  return application;
};

exports.updateApplicationStatus = async (id, status) => {
  const application = await JobApplication.findByPk(id);
  if (!application) throw new AppError('Application not found', 404);
  await application.update({ status });
  return application;
};
