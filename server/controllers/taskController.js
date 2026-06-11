const Task = require('../models/Task');

const createTask = async (req, res) => {
  try {
    const { title, description, category, priority, estimatedTime, deadline, userId } = req.body;
    const task = await Task.create({ title, description, category, priority, estimatedTime, deadline, userId });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTasksByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, status } = req.query;
    const filter = { userId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createTask, getTasksByUser, updateTask, deleteTask };
