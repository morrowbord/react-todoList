import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import Column from './Column';
import { getPriorityColor } from './TaskCard';

const KanbanBoard = ({ editingTaskId, setEditingTaskId }) => {
  const { user } = useAuth();
  const { columns, filteredColumns, addTask, toggleTask, editTask, archiveTask, moveTask, reorderInColumn, hasActiveFilters } = useTasks();
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddTask = async (columnId) => {
    try {
      const newTask = await addTask(columnId, 'Новая задача');
      setEditingTaskId(newTask.id);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDragStart = (event) => {
    if (hasActiveFilters) return;
    const { active } = event;
    for (const colId in columns) {
      const task = columns[colId].find(t => t.id === active.id);
      if (task) {
        setActiveTask(task);
        return;
      }
    }
  };

  const handleDragEnd = (event) => {
    if (hasActiveFilters) { setActiveTask(null); return; }
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    // Find which column the active task is in
    let activeColumnId = null;
    for (const colId in columns) {
      if (columns[colId].some(t => t.id === active.id)) {
        activeColumnId = colId;
        break;
      }
    }
    if (!activeColumnId) return;

    // Find target column
    const overColumnId = over.data?.current?.sortable?.containerId || over.id;
    if (!['todo', 'inProgress', 'done'].includes(overColumnId)) return;

    // Check permissions
    const activeTaskObj = columns[activeColumnId].find(t => t.id === active.id);
    if (!activeTaskObj) return;
    if (user.role !== 'admin' && activeTaskObj.created_by !== user.id) {
      alert('Нет прав для перемещения чужой задачи');
      return;
    }

    if (activeColumnId !== overColumnId) {
      // Move between columns
      moveTask(active.id, overColumnId);
    } else {
      // Reorder within same column
      const tasks = columns[activeColumnId];
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderInColumn(activeColumnId, oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {Object.entries(filteredColumns).map(([columnId, tasks]) => (
          <Column
            key={columnId}
            columnId={columnId}
            tasks={tasks}
            user={user}
            onToggle={toggleTask}
            onEdit={editTask}
            onArchive={archiveTask}
            editingTaskId={editingTaskId}
            setEditingTaskId={setEditingTaskId}
            onAddTask={handleAddTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="task-card drag-overlay" style={{ borderLeft: `4px solid ${getPriorityColor(activeTask.priority)}` }}>
            {activeTask.text}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
