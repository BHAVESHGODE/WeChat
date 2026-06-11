const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasksByUser,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

router.post('/', createTask);
router.get('/:userId', getTasksByUser);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
