import multer from 'multer';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Memory storage: we stream the buffer straight to Azure Blob Storage,
// we never write the upload to local disk.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Only image files are allowed'));
      return;
    }
    callback(null, true);
  },
});