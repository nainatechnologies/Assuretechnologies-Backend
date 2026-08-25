const { z } = require('zod');

const createJobSchema = z.object({
  title: z.string().min(2).max(200),
  overview: z.string().max(500).optional(),
  description: z.string().max(500).optional(),
  experience: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance']).optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  responsibilities: z.string().max(200).optional(),
  skills: z.string().max(100).optional(),
  postedDate: z.string().optional(),
});

const updateJobSchema = createJobSchema.partial();

const submitApplicationSchema = z.object({
  jobId: z.string(),
  applicantName: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  gender: z.enum(['Male', 'Female', 'Other']).optional().or(z.literal('')),
  dob: z.string().optional(),
  experience: z.string().max(50).optional(),
  currentSalary: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number').optional().or(z.literal('')),
  expectedSalary: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number').optional().or(z.literal('')),
  availableToJoin: z.string().optional(),
  preferredLocation: z.string().optional(),
  currentLocation: z.string().optional(),
  skills: z.string().max(100).optional(),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['Pending', 'Reviewed', 'Accepted', 'Rejected']),
});

module.exports = { createJobSchema, updateJobSchema, submitApplicationSchema, updateApplicationStatusSchema };
