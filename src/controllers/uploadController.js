exports.uploadImage = (req, res, next) => {
  req.file ? res.json({ success: true, data: { path: `/uploads/${req.file.filename}` } }) : res.status(400).json({ success: false, message: 'No file' });
};

exports.uploadContent = (req, res, next) => {
  req.file ? res.json({ success: true, data: { path: `/uploads/${req.file.filename}` } }) : res.status(400).json({ success: false, message: 'No file' });
};
