import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const COLUMN_NAMES = {
  todo: 'Задачи',
  inProgress: 'В работе',
  done: 'Готово',
};

const Column = ({ columnId, tasks, user, onToggle, onEdit, onArchive, editingTaskId, setEditingTaskId, onAddTask }) => {
  return (
    <div className={`column ${columnId}`}>
      <div className="column-header">
        <h3>
          {COLUMN_NAMES[columnId]}
          <span className="task-count"> ({tasks.length})</span>
        </h3>
        <button className="add-task-btn" onClick={() => onAddTask(columnId)}>
          + Добавить
        </button>
      </div>
      <SortableContext id={columnId} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              user={user}
              onToggle={onToggle}
              onEdit={onEdit}
              onArchive={onArchive}
              startEditing={editingTaskId === task.id}
              setEditingTaskId={setEditingTaskId}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default Column;
