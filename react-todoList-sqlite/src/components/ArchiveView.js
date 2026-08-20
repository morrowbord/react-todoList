import React, { useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { getPriorityLabel, getPriorityColor } from './TaskCard';

const ArchiveView = () => {
  const { archivedTasks, restoreTask, deleteTask } = useTasks();
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleRestore = async (task) => {
    try {
      await restoreTask(task);
    } catch (error) {
      alert('Ошибка при восстановлении: ' + error.message);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      setConfirmDelete(null);
    } catch (error) {
      alert('Ошибка при удалении: ' + error.message);
    }
  };

  return (
    <div className="archive-view">
      <h2>Архив задач</h2>
      <div className="archived-tasks-list">
        {archivedTasks.length === 0 ? (
          <p className="empty-state">Нет архивированных задач</p>
        ) : (
          archivedTasks.map(task => (
            <div key={task.id} className="archived-task-card" style={{ borderLeft: `4px solid ${getPriorityColor(task.priority)}` }}>
              <div className="archived-task-header">
                <strong>{task.text}</strong>
                {task.completed && <span className="completed-badge">✓ Выполнено</span>}
              </div>

              <div className="archived-task-priority">
                <strong>Статус:</strong>{' '}
                <span style={{ color: getPriorityColor(task.priority) }}>
                  {getPriorityLabel(task.priority)}
                </span>
              </div>

              {task.assignee && (
                <div className="archived-task-meta">
                  <strong>👤</strong> {task.assignee}
                </div>
              )}

              {task.due_date && (
                <div className="archived-task-meta">
                  <strong>📅</strong> {new Date(task.due_date).toLocaleDateString('ru-RU')}
                </div>
              )}

              <div className="archived-task-actions">
                <button className="restore-btn" onClick={() => handleRestore(task)}>
                  Восстановить
                </button>
                {confirmDelete === task.id ? (
                  <div className="confirm-delete">
                    <span>Удалить навсегда?</span>
                    <button className="delete-btn" onClick={() => handleDelete(task.id)}>
                      Да
                    </button>
                    <button className="cancel-btn" onClick={() => setConfirmDelete(null)}>
                      Нет
                    </button>
                  </div>
                ) : (
                  <button className="delete-btn" onClick={() => setConfirmDelete(task.id)}>
                    Удалить навсегда
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ArchiveView;
