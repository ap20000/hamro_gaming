import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile } from '../../controllers/uploadController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

router.post('/', upload.single('file'), uploadFile);

export default router;
