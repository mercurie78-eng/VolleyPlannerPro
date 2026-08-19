import cors from 'cors';
import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import type { AttendanceRecord, Exercise, Player, SavedSession } from '../src/types/index.js';
import {
  deleteExercise,
  deletePlayer,
  deleteSavedSession,
  getDb,
  getExerciseById,
  getPlayerById,
  getSavedSessionById,
  getSessionAttendance,
  insertExercise,
  insertPlayer,
  insertSavedSession,
  listExercises,
  listPlayers,
  listSavedSessions,
  updateExercise,
  updateExerciseImageUrl,
  updatePlayer,
  updateSavedSession,
  upsertSessionAttendance,
} from './db.js';
import {
  deleteExerciseImageFile,
  ensureUploadsDir,
  exerciseImageUrl,
  findExerciseImageFile,
  saveExerciseImageFile,
  UPLOAD_TMP_DIR,
} from './images.js';
import { seedIfEmpty, seedSessionsIfEmpty, seedPlayersIfEmpty, migrateSessionsIfNeeded } from './seed.js';

const PORT = Number(process.env.PORT) || 3001;

const db = getDb();
seedIfEmpty(db);
seedSessionsIfEmpty(db);
seedPlayersIfEmpty(db);
migrateSessionsIfNeeded(db);
ensureUploadsDir();

const upload = multer({
  dest: UPLOAD_TMP_DIR,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Sono ammessi solo file immagine'));
  },
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/exercises', (_req, res) => {
  res.json(listExercises(db));
});

app.get('/api/exercises/:id', (req, res) => {
  const exercise = getExerciseById(db, req.params.id);
  if (!exercise) {
    res.status(404).json({ error: 'Esercizio non trovato' });
    return;
  }
  res.json(exercise);
});

app.post('/api/exercises', (req, res) => {
  const exercise = req.body as Exercise;
  if (!exercise?.id || !exercise?.title?.trim()) {
    res.status(400).json({ error: 'id e title sono obbligatori' });
    return;
  }
  if (getExerciseById(db, exercise.id)) {
    res.status(409).json({ error: 'Esercizio già esistente' });
    return;
  }
  insertExercise(db, exercise);
  res.status(201).json(exercise);
});

app.put('/api/exercises/:id', (req, res) => {
  const exercise = { ...(req.body as Exercise), id: req.params.id };
  if (!exercise.title?.trim()) {
    res.status(400).json({ error: 'title è obbligatorio' });
    return;
  }
  const updated = updateExercise(db, exercise);
  if (!updated) {
    res.status(404).json({ error: 'Esercizio non trovato' });
    return;
  }
  res.json(updated);
});

app.get('/api/exercises/:id/image', (req, res) => {
  const filePath = findExerciseImageFile(req.params.id);
  if (!filePath) {
    res.status(404).json({ error: 'Immagine non trovata' });
    return;
  }
  res.sendFile(filePath);
});

app.post('/api/exercises/:id/image', (req, res) => {
  upload.single('image')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload non riuscito';
      res.status(400).json({ error: message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Nessun file immagine inviato' });
      return;
    }

    const exercise = getExerciseById(db, req.params.id);
    if (!exercise) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Esercizio non trovato' });
      return;
    }

    try {
      saveExerciseImageFile(req.params.id, req.file.path, req.file.originalname);
      const imageUrl = exerciseImageUrl(req.params.id);
      const updated = updateExerciseImageUrl(db, req.params.id, imageUrl);
      res.json(updated);
    } catch (uploadErr) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({
        error: uploadErr instanceof Error ? uploadErr.message : 'Upload non riuscito',
      });
    }
  });
});

app.delete('/api/exercises/:id/image', (req, res) => {
  const exercise = getExerciseById(db, req.params.id);
  if (!exercise) {
    res.status(404).json({ error: 'Esercizio non trovato' });
    return;
  }

  deleteExerciseImageFile(req.params.id);
  updateExerciseImageUrl(db, req.params.id, null);
  res.status(204).send();
});

app.delete('/api/exercises/:id', (req, res) => {
  deleteExerciseImageFile(req.params.id);
  const deleted = deleteExercise(db, req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Esercizio non trovato' });
    return;
  }
  res.status(204).send();
});

app.get('/api/sessions', (_req, res) => {
  res.json(listSavedSessions(db));
});

app.get('/api/sessions/:id', (req, res) => {
  const session = getSavedSessionById(db, req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Allenamento non trovato' });
    return;
  }
  res.json(session);
});

app.post('/api/sessions', (req, res) => {
  const session = req.body as SavedSession;
  if (!session?.id || !session?.title?.trim() || !session?.date) {
    res.status(400).json({ error: 'id, title e date sono obbligatori' });
    return;
  }
  if (!Array.isArray(session.items)) {
    res.status(400).json({ error: 'items deve essere un array' });
    return;
  }
  if (getSavedSessionById(db, session.id)) {
    res.status(409).json({ error: 'Allenamento già esistente' });
    return;
  }
  insertSavedSession(db, session);
  res.status(201).json(session);
});

app.put('/api/sessions/:id', (req, res) => {
  const session = { ...(req.body as SavedSession), id: req.params.id };
  if (!session.title?.trim() || !session.date) {
    res.status(400).json({ error: 'title e date sono obbligatori' });
    return;
  }
  if (!Array.isArray(session.items)) {
    res.status(400).json({ error: 'items deve essere un array' });
    return;
  }
  const updated = updateSavedSession(db, session);
  if (!updated) {
    res.status(404).json({ error: 'Allenamento non trovato' });
    return;
  }
  res.json(updated);
});

app.delete('/api/sessions/:id', (req, res) => {
  const deleted = deleteSavedSession(db, req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Allenamento non trovato' });
    return;
  }
  res.status(204).send();
});

app.get('/api/players', (_req, res) => {
  res.json(listPlayers(db));
});

app.get('/api/players/:id', (req, res) => {
  const player = getPlayerById(db, req.params.id);
  if (!player) {
    res.status(404).json({ error: 'Giocatore non trovato' });
    return;
  }
  res.json(player);
});

app.post('/api/players', (req, res) => {
  const player = req.body as Player;
  if (!player?.id || !player?.firstName?.trim() || !player?.lastName?.trim()) {
    res.status(400).json({ error: 'id, firstName e lastName sono obbligatori' });
    return;
  }
  if (!player?.role?.trim()) {
    res.status(400).json({ error: 'role è obbligatorio' });
    return;
  }
  if (getPlayerById(db, player.id)) {
    res.status(409).json({ error: 'Giocatore già esistente' });
    return;
  }
  insertPlayer(db, player);
  res.status(201).json(player);
});

app.put('/api/players/:id', (req, res) => {
  const player = { ...(req.body as Player), id: req.params.id };
  if (!player.firstName?.trim() || !player.lastName?.trim()) {
    res.status(400).json({ error: 'firstName e lastName sono obbligatori' });
    return;
  }
  if (!player.role?.trim()) {
    res.status(400).json({ error: 'role è obbligatorio' });
    return;
  }
  const updated = updatePlayer(db, player);
  if (!updated) {
    res.status(404).json({ error: 'Giocatore non trovato' });
    return;
  }
  res.json(updated);
});

app.delete('/api/players/:id', (req, res) => {
  const deleted = deletePlayer(db, req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Giocatore non trovato' });
    return;
  }
  res.status(204).send();
});

app.get('/api/sessions/:id/attendance', (req, res) => {
  const session = getSavedSessionById(db, req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Allenamento non trovato' });
    return;
  }
  res.json(getSessionAttendance(db, req.params.id));
});

app.put('/api/sessions/:id/attendance', (req, res) => {
  const session = getSavedSessionById(db, req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Allenamento non trovato' });
    return;
  }

  const body = req.body as { records?: AttendanceRecord[] };
  if (!Array.isArray(body.records)) {
    res.status(400).json({ error: 'records deve essere un array' });
    return;
  }

  for (const record of body.records) {
    if (!record.playerId) {
      res.status(400).json({ error: 'Ogni record deve avere playerId' });
      return;
    }
    if (!getPlayerById(db, record.playerId)) {
      res.status(400).json({ error: `Giocatore ${record.playerId} non trovato` });
      return;
    }
  }

  const saved = upsertSessionAttendance(
    db,
    req.params.id,
    body.records.map((record) => ({ ...record, sessionId: req.params.id }))
  );
  res.json(saved);
});

const server = app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} già in uso. Termina l'altro processo oppure avvia con PORT=<altra_porta>.`);
    process.exit(1);
  }
  throw err;
});
