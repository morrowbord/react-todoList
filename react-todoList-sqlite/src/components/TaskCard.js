import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'urgent': return 'Срочно';
    case 'notImportant': return 'Не важно';
    case 'idea': return 'Идея';
    default: return 'Идея';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return '#e74c3c';
    case 'notImportant': return '#95a5a6';
    case 'idea': return '#3498db';
    default: return '#3498db';
  }
};

export { getPriorityLabel, getPriorityColor };

const TaskCard = ({
  task,
  user,
  onToggle,
  onEdit,
  onArchive,
  startEditing = false,
  setEditingTaskId,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [isEditing, setIsEditing] = useState(startEditing);
  const [editText, setEditText] = useState(task.text);
  const [editAssignee, setEditAssignee] = useState(task.assignee || '');
  const [editDate, setEditDate] = useState(task.due_date || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'idea');

  useEffect(() => {
    setIsEditing(startEditing);
  }, [startEditing]);

  // Reset edit fields when task changes
  useEffect(() => {
    setEditText(task.text);
    setEditAssignee(task.assignee || '');
    setEditDate(task.due_date || '');
    setEditPriority(task.priority || 'idea');
  }, [task.text, task.assignee, task.due_date, task.priority]);

  const canEdit = user.role === 'admin' || task.created_by === user.id;

  const handleEdit = async () => {
    await onEdit(task.id, editText, task.column_id, editPriority, editAssignee, editDate);
    setIsEditing(false);
    setEditingTaskId(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingTaskId(null);
    // Reset to original values
    setEditText(task.text);
    setEditAssignee(task.assignee || '');
    setEditDate(task.due_date || '');
    setEditPriority(task.priority || 'idea');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
  };

  if (isEditing) {
    if (!canEdit) {
      return <div className="task-card no-perms">У вас нет прав для редактирования этой задачи.</div>;
    }
    return (
      <div ref={setNodeRef} className="task-card task-card-editing" style={style}>
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          autoFocus
          className="task-edit-input"
        />
        <select
          value={editPriority}
          onChange={(e) => setEditPriority(e.target.value)}
          className="task-edit-input"
        >
          <option value="urgent">Срочно</option>
          <option value="notImportant">Проект</option>
          <option value="idea">Идея</option>
        </select>
        <input
          type="text"
          value={editAssignee}
          onChange={(e) => setEditAssignee(e.target.value)}
          placeholder="Исполнитель"
          className="task-edit-input"
        />
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value || null)}
          className="task-edit-input"
        />
        <div className="task-edit-actions">
          <button onClick={handleEdit}>Сохранить</button>
          <button onClick={handleCancel} className="cancel-btn">Отмена</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} className="task-card" style={style}>
      <div className="task-card-header" {...attributes} {...listeners}>
        <span className="drag-handle">≡</span>
        <span
          className={task.completed ? 'task-text completed' : 'task-text'}
        >
          {task.text}
        </span>
      </div>

      <div className="task-card-checkbox">
        <label>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => canEdit ? onToggle(task.id) : alert('Нет прав')}
            disabled={!canEdit}
          />
          Выполнено
        </label>
      </div>

      <div className="task-card-priority">
        <strong>Статус:</strong>{' '}
        <span style={{ color: getPriorityColor(task.priority) }}>
          {getPriorityLabel(task.priority)}
        </span>
      </div>

      {task.assignee && (
        <div className="task-card-meta">
          <strong>👤</strong> {task.assignee}
        </div>
      )}

      {task.due_date && (
        <div className="task-card-meta">
          <strong>📅</strong> {formatDate(task.due_date)}
          {new Date(task.due_date) < new Date() && !task.completed && (
            <span className="overdue-badge">(просрочено)</span>
          )}
        </div>
      )}

      <div className="task-card-actions">
        <button
          onClick={() => { setIsEditing(true); setEditingTaskId(task.id); }}
          disabled={!canEdit}
        >
          {canEdit ? 'Редактировать' : 'Нет прав'}
        </button>
        <button
          className="archive-btn"
          onClick={() => onArchive(task.id)}
        >
          Архивировать
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
