const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const JobPosting = sequelize.define('JobPosting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobCode: { type: DataTypes.STRING, allowNull: true, unique: true },
  title: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Job title is required' },
      len: { args: [2, 200], msg: 'Job title must be between 2 and 200 characters' }
    }
  },
  overview: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    validate: { len: { args: [0, 500], msg: 'Overview max length is 500 characters' } }
  },
  description: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    validate: { len: { args: [0, 500], msg: 'Description max length is 500 characters' } }
  },
  experience: { 
    type: DataTypes.STRING, 
    allowNull: true,
    validate: { len: { args: [0, 100], msg: 'Experience max length is 100 characters' } }
  },
  industry: { 
    type: DataTypes.STRING, 
    allowNull: true,
    validate: { len: { args: [0, 100], msg: 'Industry max length is 100 characters' } }
  },
  employmentType: { 
    type: DataTypes.STRING, 
    allowNull: true,
    validate: { 
      isIn: {
        args: [['full-time', 'part-time', 'contract', 'internship', 'freelance', '']],
        msg: 'Invalid employment type'
      }
    }
  },
  location: { 
    type: DataTypes.STRING, 
    allowNull: true,
    validate: { len: { args: [0, 100], msg: 'Location max length is 100 characters' } }
  },
  responsibilities: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    validate: { len: { args: [0, 200], msg: 'Responsibilities max length is 200 characters' } }
  },
  skills: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    validate: { len: { args: [0, 100], msg: 'Skills max length is 100 characters' } }
  },
  postedDate: { type: DataTypes.DATEONLY, allowNull: true },
}, { timestamps: true, tableName: 'job_postings' });

const JobApplication = sequelize.define('JobApplication', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  jobId: { type: DataTypes.UUID, allowNull: false, references: { model: 'job_postings', key: 'id' } },
  applicantName: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Applicant name is required' },
      len: { args: [3, 100], msg: 'Applicant name must be between 3 and 100 characters' }
    }
  },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Email is required' },
      isEmail: { msg: 'Must be a valid email address' }
    }
  },
  phone: { 
    type: DataTypes.STRING, 
    allowNull: false,
    validate: {
      is: {
        args: /^[6-9]\d{9}$/,
        msg: 'Please enter a valid 10-digit mobile number'
      }
    }
  },
  gender: { 
    type: DataTypes.STRING, 
    allowNull: true,
    validate: {
      isIn: {
        args: [['Male', 'Female', 'Other', '']],
        msg: 'Invalid gender'
      }
    }
  },
  dob: { type: DataTypes.DATEONLY, allowNull: true },
  experience: { 
    type: DataTypes.STRING, 
    allowNull: true,
    validate: { len: { args: [0, 50], msg: 'Experience max length is 50 characters' } }
  },
  currentSalary: { 
    type: DataTypes.STRING, 
    allowNull: true,
    validate: {
      is: { args: /^(\d+(\.\d+)?)?$/, msg: 'Current salary must be a valid number' }
    }
  },
  expectedSalary: { 
    type: DataTypes.STRING, 
    allowNull: true,
    validate: {
      is: { args: /^(\d+(\.\d+)?)?$/, msg: 'Expected salary must be a valid number' }
    }
  },
  availableToJoin: { type: DataTypes.STRING, allowNull: true },
  preferredLocation: { type: DataTypes.STRING, allowNull: true },
  currentLocation: { type: DataTypes.STRING, allowNull: true },
  skills: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    validate: { len: { args: [0, 100], msg: 'Skills max length is 100 characters' } }
  },
  resumeUrl: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('Pending','Reviewed','Accepted','Rejected'), defaultValue: 'Pending' },
  appliedDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
}, { timestamps: true, tableName: 'job_applications' });

JobPosting.beforeCreate((job) => {
  const date = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  job.jobCode = `${yyyy}${MM}${dd}${hh}${mm}${ss}`;
});

JobPosting.hasMany(JobApplication, { foreignKey: 'jobId', as: 'applications', onDelete: 'CASCADE' });
JobApplication.belongsTo(JobPosting, { foreignKey: 'jobId', as: 'job' });

module.exports = { JobPosting, JobApplication };
