const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AMBIENT_DIR = path.join(__dirname, '..', 'uploads', 'ambient');
if (!fs.existsSync(AMBIENT_DIR)) {
  fs.mkdirSync(AMBIENT_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AMBIENT_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp3', '.wav', '.ogg', '.m4a', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only audio files (mp3, wav, ogg, m4a, webm) are allowed'));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// In-memory sound registry (seeded defaults)
let sounds = [
  { id: 'white-noise', name: 'White Noise', icon: '🌊', type: 'generated', url: '' },
  { id: 'pink-noise', name: 'Pink Noise', icon: '🌸', type: 'generated', url: '' },
  { id: 'brown-noise', name: 'Brown Noise', icon: '🌫️', type: 'generated', url: '' },
];

// GET /api/ambient — list all sounds
router.get('/', (req, res) => {
  // Add file-based sounds
  const fileSounds = [];
  try {
    const files = fs.readdirSync(AMBIENT_DIR);
    files.forEach((f) => {
      const id = f.replace(/\.[^.]+$/, '');
      if (!sounds.find((s) => s.id === id)) {
        fileSounds.push({
          id,
          name: id.replace(/^\d+-/, '').replace(/[-_]/g, ' ').replace(/\.[^.]+$/, ''),
          icon: '🎵',
          type: 'file',
          url: `/uploads/ambient/${f}`,
          filename: f,
        });
      }
    });
  } catch (e) { /* ignore */ }
  res.json([...sounds, ...fileSounds]);
});

// POST /api/ambient/upload — upload ambient sound
router.post('/upload', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
  const sound = {
    id: req.file.filename.replace(/\.[^.]+$/, ''),
    name: req.body.name || req.file.originalname.replace(/\.[^.]+$/, ''),
    icon: req.body.icon || '🎵',
    type: 'file',
    url: `/uploads/ambient/${req.file.filename}`,
    filename: req.file.filename,
  };
  sounds.push(sound);
  res.status(201).json(sound);
});

// DELETE /api/ambient/:id — delete a custom sound
router.delete('/:id', (req, res) => {
  const idx = sounds.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Sound not found' });
  const sound = sounds[idx];
  if (sound.type === 'generated') return res.status(400).json({ error: 'Cannot delete built-in sounds' });
  const filePath = path.join(AMBIENT_DIR, sound.filename || sound.id);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
  sounds.splice(idx, 1);
  res.json({ message: 'Sound deleted' });
});

module.exports = router;
