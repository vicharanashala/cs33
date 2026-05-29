const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const uploadAvatar = (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded', 400));

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: 'faq-portal/avatars',
      width: 256,
      height: 256,
      crop: 'fill',
      gravity: 'face',
      format: 'jpg',
    },
    (err, result) => {
      if (err || !result) return next(new AppError('Cloudinary upload failed', 500));
      res.json({ success: true, url: result.secure_url });
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
};

module.exports = { uploadAvatar };