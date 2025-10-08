import './App.css'
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ✅ ВЫНЕСЕННЫЕ ФУНКЦИИ — доступны везде
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

// Компонент задачи
function TaskCard({ task, onToggle, onDelete, onEdit, onUpdateAssignee, onUpdateDate, onUpdatePriority }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editAssignee, setEditAssignee] = useState(task.assignee || '');
  const [editDate, setEditDate] = useState(task.dueDate || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'idea');

  const handleEdit = () => {
    onEdit(task.id, editText, task.columnId);
    onUpdateAssignee(task.id, editAssignee, task.columnId);
    onUpdateDate(task.id, editDate, task.columnId);
    onUpdatePriority(task.id, editPriority, task.columnId);
    setIsEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={{
          padding: '12px',
          marginBottom: '8px',
          borderRadius: '6px',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          autoFocus
          style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
        />
        <select
          value={editPriority}
          onChange={(e) => setEditPriority(e.target.value)}
          style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
        >
          <option value="urgent">Срочно</option>
          <option value="notImportant">Не важно</option>
          <option value="idea">Идея</option>
        </select>
        <input
          type="text"
          value={editAssignee}
          onChange={(e) => setEditAssignee(e.target.value)}
          placeholder="Исполнитель"
          style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
        />
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
        />
        <button onClick={handleEdit} style={{ marginRight: '8px' }}>
          Сохранить
        </button>
        <button onClick={() => setIsEditing(false)}>Отмена</button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        padding: '12px',
        marginBottom: '8px',
        borderRadius: '6px',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
      }}
    >
      <div
        style={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}
        {...attributes}
        {...listeners}
      >
        <span>≡</span>
        <span style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#999' : 'inherit' }}>
          {task.text}
        </span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id, task.columnId)}
            style={{ marginRight: '6px' }}
          />
          Выполнено
        </label>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <strong>Статус:</strong> <span style={{ color: getPriorityColor(task.priority) }}>{getPriorityLabel(task.priority)}</span>
      </div>

      {task.assignee && (
        <div style={{ marginBottom: '4px' }}>
          <strong>👤</strong> {task.assignee}
        </div>
      )}

      {task.dueDate && (
        <div style={{ marginBottom: '4px' }}>
          <strong>📅</strong> {formatDate(task.dueDate)}
          {new Date(task.dueDate) < new Date() && !task.completed && (
            <span style={{ color: 'red', marginLeft: '4px' }}>(просрочено)</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
        <button onClick={() => setIsEditing(true)}>Редактировать</button>
        <button className="delete-btn" onClick={() => onDelete(task.id, task.columnId)}>
          Удалить
        </button>
      </div>
    </div>
  );
}

function App() {
  const [columns, setColumns] = useState({
    todo: [],
    inProgress: [],
    done: []
  });
  const [darkMode, setDarkMode] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    const savedColumns = JSON.parse(localStorage.getItem('kanban-columns')) || {
      todo: [],
      inProgress: [],
      done: []
    };
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setColumns(savedColumns);
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('kanban-columns', JSON.stringify(columns));
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [columns, darkMode]);

  const addTask = (columnId, text, priority = 'idea', assignee = '', dueDate = '') => {
    const newTask = {
      id: Date.now(),
      text,
      completed: false,
      priority,
      assignee,
      dueDate,
      columnId
    };
    setColumns(prev => ({
      ...prev,
      [columnId]: [...prev[columnId], newTask]
    }));
  };

  const toggleTask = (id, columnId) => {
    setColumns(prev => ({
      ...prev,
      [columnId]: prev[columnId].map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const deleteTask = (id, columnId) => {
    setColumns(prev => ({
      ...prev,
      [columnId]: prev[columnId].filter(task => task.id !== id)
    }));
  };

  const editTask = (id, newText, columnId) => {
    if (newText.trim() === '') return;
    setColumns(prev => ({
      ...prev,
      [columnId]: prev[columnId].map(task =>
        task.id === id ? { ...task, text: newText.trim() } : task
      )
    }));
  };

  const updateAssignee = (id, newAssignee, columnId) => {
    setColumns(prev => ({
      ...prev,
      [columnId]: prev[columnId].map(task =>
        task.id === id ? { ...task, assignee: newAssignee } : task
      )
    }));
  };

  const updateDate = (id, newDate, columnId) => {
    setColumns(prev => ({
      ...prev,
      [columnId]: prev[columnId].map(task =>
        task.id === id ? { ...task, dueDate: newDate } : task
      )
    }));
  };

  const updatePriority = (id, newPriority, columnId) => {
    setColumns(prev => ({
      ...prev,
      [columnId]: prev[columnId].map(task =>
        task.id === id ? { ...task, priority: newPriority } : task
      )
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
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
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    let activeColumnId = null;
    for (const colId in columns) {
      if (columns[colId].some(t => t.id === active.id)) {
        activeColumnId = colId;
        break;
      }
    }

    if (!activeColumnId) return;

    const overColumnId = over.data?.current?.sortable?.containerId || over.id;

    if (!['todo', 'inProgress', 'done'].includes(overColumnId)) return;

    if (activeColumnId === overColumnId) {
      const tasks = columns[activeColumnId];
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      if (oldIndex !== newIndex) {
        setColumns(prev => ({
          ...prev,
          [activeColumnId]: arrayMove(tasks, oldIndex, newIndex)
        }));
      }
    } else {
      const activeTask = columns[activeColumnId].find(t => t.id === active.id);
      if (!activeTask) return;

      setColumns(prev => ({
        ...prev,
        [activeColumnId]: prev[activeColumnId].filter(t => t.id !== active.id),
        [overColumnId]: [...prev[overColumnId], { ...activeTask, columnId: overColumnId }]
      }));
    }
  };

  const stats = {
    todo: { total: columns.todo.length, completed: columns.todo.filter(t => t.completed).length },
    inProgress: { total: columns.inProgress.length, completed: columns.inProgress.filter(t => t.completed).length },
    done: { total: columns.done.length, completed: columns.done.filter(t => t.completed).length }
  };
  const totalTasks = stats.todo.total + stats.inProgress.total + stats.done.total;
  const totalCompleted = stats.todo.completed + stats.inProgress.completed + stats.done.completed;

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <h1>Моя Kanban-доска</h1>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Светлая тема' : 'Тёмная тема'}
        </button>
      </div>

      <div className="stats">
        <div className="stat-card"><h4>Всего задач</h4><p>{totalTasks}</p></div>
        <div className="stat-card"><h4>Выполнено</h4><p>{totalCompleted}</p></div>
        <div className="stat-card"><h4>Осталось</h4><p>{totalTasks - totalCompleted}</p></div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {Object.entries(columns).map(([columnId, tasks]) => (
            <div key={columnId} className={`column ${columnId}`}>
              <div className="column-header">
                <h3>
                  {columnId === 'todo' ? 'Задачи' : columnId === 'inProgress' ? 'В работе' : 'Готово'}
                  <span className="task-count"> ({tasks.length})</span>
                </h3>
                <button onClick={() => addTask(columnId, 'Новая задача')}>
                  + Добавить
                </button>
              </div>
              <SortableContext id={columnId} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="task-list">
                  {tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onEdit={editTask}
                      onUpdateAssignee={updateAssignee}
                      onUpdateDate={updateDate}
                      onUpdatePriority={updatePriority}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{
              padding: '12px',
              background: 'white',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              borderLeft: `4px solid ${getPriorityColor(activeTask.priority)}`,
            }}>
              {activeTask.text}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default App;