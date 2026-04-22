import path from 'path';
import fs from 'fs';
import multer, { diskStorage, MulterError } from 'multer';
import type { Request, Response, NextFunction } from 'express';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const uploadInstance = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

export const uploadSingle = (fieldName: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    uploadInstance.single(fieldName)(req, res, (err) => {
      if (err instanceof MulterError) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err) {
        res.status(400).json({ error: (err as Error).message ?? 'Upload failed' });
        return;
      }
      next();
    });
  };
