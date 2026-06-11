const Note = require('../models/Note');

const createNote = async (req, res) => {
  try {
    const { title, content, tags, color, userId } = req.body;
    const note = await Note.create({ title, content, tags, color, userId });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNotesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findByIdAndUpdate(id, { ...req.body, updatedAt: Date.now() }, { new: true, runValidators: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findByIdAndDelete(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createNote, getNotesByUser, updateNote, deleteNote };
