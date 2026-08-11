import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, '..', 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads', 'exercises');
export const UPLOAD_TMP_DIR = path.join(DATA_DIR, 'uploads', 'tmp');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function ensureUploadsDir(): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });
}

export function exerciseImageUrl(exerciseId: string): string {
  return `/api/exercises/${encodeURIComponent(exerciseId)}/image`;
}

export function findExerciseImageFile(exerciseId: string): string | undefined {
  ensureUploadsDir();
  const prefix = `${exerciseId}.`;
  const match = fs.readdirSync(UPLOADS_DIR).find((file) => file.startsWith(prefix));
  return match ? path.join(UPLOADS_DIR, match) : undefined;
}

export function deleteExerciseImageFile(exerciseId: string): void {
  const filePath = findExerciseImageFile(exerciseId);
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function saveExerciseImageFile(exerciseId: string, tempPath: string, originalName: string): string {
  ensureUploadsDir();
  deleteExerciseImageFile(exerciseId);

  const ext = path.extname(originalName).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg';
  const destPath = path.join(UPLOADS_DIR, `${exerciseId}${safeExt}`);

  fs.copyFileSync(tempPath, destPath);
  fs.unlinkSync(tempPath);
  return destPath;
}

export function extensionFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.jpg';
  }
}
