const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '../../.env' }); // Ensure env is loaded if not already

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const createUpload = (folderName) => {
  // Set up the Cloudinary storage engine
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `assure-backend/${folderName}`, // Automatically creates subfolders in Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    },
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type! Only images and PDFs are allowed.'), false);
    }
  };

  return multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
  });
};

module.exports = createUpload;

