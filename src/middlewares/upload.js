const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Invalid file type'));
};

exports.uploadImage = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: fileFilter(['.jpg','.jpeg','.png']) }).single('image');
exports.uploadContent = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: fileFilter(['.pdf','.epub','.mp4']) }).single('file');
