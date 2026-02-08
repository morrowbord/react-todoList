const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // GET all tasks
  router.get('/', (req, res) => {
    const sql = `
      SELECT t.*, u.email as created_by_email
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.archived = 0
      ORDER BY t.created_at DESC
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // GET archived tasks
  router.get('/archived', (req, res) => {
    const sql = `
      SELECT t.*, u.email as created_by_email
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.archived = 1
      ORDER BY t.created_at DESC
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // GET task by ID
  router.get('/:id', (req, res) => {
    const sql = 'SELECT * FROM tasks WHERE id = ?';
    const params = [req.params.id];

    db.get(sql, params, (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(row);
    });
  });

  // POST create new task
  router.post('/', (req, res) => {
    // Extract user ID from the authenticated token
    const userId = req.user.id;
    const { text, completed = false, priority = 'idea', assignee = '', due_date = null, column_id = 'todo' } = req.body;

    const sql = 'INSERT INTO tasks (text, completed, priority, assignee, due_date, column_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = [text, completed, priority, assignee, due_date, column_id, userId];

    db.run(sql, params, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, text, completed, priority, assignee, due_date, column_id, created_by: userId });
    });
  });

  // PUT update task
  router.put('/:id', (req, res) => {
    // First, verify that the user owns this task or is an admin
    const userId = req.user.id;
    const userRole = req.user.role;

    const taskId = req.params.id;
    const { text, completed, priority, assignee, due_date, column_id } = req.body;

    // Check if user owns the task or is admin
    const checkOwnershipSql = 'SELECT created_by FROM tasks WHERE id = ?';
    db.get(checkOwnershipSql, [taskId], (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Allow update if user is admin or owns the task
      if (userRole !== 'admin' && task.created_by != userId) {
        return res.status(403).json({ error: 'Not authorized to update this task' });
      }

      const sql = 'UPDATE tasks SET text = ?, completed = ?, priority = ?, assignee = ?, due_date = ?, column_id = ? WHERE id = ?';
      const params = [text, completed, priority, assignee, due_date, column_id, taskId];

      db.run(sql, params, function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ id: taskId, text, completed, priority, assignee, due_date, column_id, created_by: task.created_by });
      });
    });
  });

  // PUT toggle task completion
  router.put('/:id/toggle', (req, res) => {
    // Verify user has permission to toggle this task
    const userId = req.user.id;
    const userRole = req.user.role;

    const taskId = req.params.id;

    // Check if user owns the task or is admin
    const checkOwnershipSql = 'SELECT created_by FROM tasks WHERE id = ?';
    db.get(checkOwnershipSql, [taskId], (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Allow toggle if user is admin or owns the task
      if (userRole !== 'admin' && task.created_by != userId) {
        return res.status(403).json({ error: 'Not authorized to toggle this task' });
      }

      const sql = 'UPDATE tasks SET completed = NOT completed WHERE id = ?';

      db.run(sql, [taskId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        // Return updated task
        const getSql = 'SELECT * FROM tasks WHERE id = ?';
        db.get(getSql, [taskId], (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        });
      });
    });
  });

  // PUT archive task
  router.put('/:id/archive', (req, res) => {
    // Verify user has permission to archive this task
    const userId = req.user.id;
    const userRole = req.user.role;

    const taskId = req.params.id;

    // Check if user owns the task or is admin
    const checkOwnershipSql = 'SELECT created_by FROM tasks WHERE id = ?';
    db.get(checkOwnershipSql, [taskId], (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Allow archive if user is admin or owns the task
      if (userRole !== 'admin' && task.created_by != userId) {
        return res.status(403).json({ error: 'Not authorized to archive this task' });
      }

      const sql = 'UPDATE tasks SET archived = 1 WHERE id = ?';

      db.run(sql, [taskId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        // Return updated task
        const getSql = 'SELECT * FROM tasks WHERE id = ?';
        db.get(getSql, [taskId], (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        });
      });
    });
  });

  // DELETE task permanently
  router.delete('/:id', (req, res) => {
    // Verify user has permission to delete this task
    const userId = req.user.id;
    const userRole = req.user.role;

    const taskId = req.params.id;

    // Check if user owns the task or is admin
    const checkOwnershipSql = 'SELECT created_by FROM tasks WHERE id = ?';
    db.get(checkOwnershipSql, [taskId], (err, task) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Allow deletion if user is admin or owns the task
      if (userRole !== 'admin' && task.created_by != userId) {
        return res.status(403).json({ error: 'Not authorized to delete this task' });
      }

      const sql = 'DELETE FROM tasks WHERE id = ?';

      db.run(sql, [taskId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }
        res.status(204).json({ message: 'Task deleted successfully' });
      });
    });
  });

  return router;
};