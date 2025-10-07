import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Компонент задачи
function TaskCard({ task, onToggle, onDelete, onEdit }) {
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

  const handleEdit = () => {
    onEdit(task.id, editText);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        padding: '12px',
        marginBottom: '8px',
        borderRadius: '6px',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: task.priority === 'high' ? '4px solid #e74c3c' : 
                    task.priority === 'medium' ? '4px solid #f39c12' : 
                    '4px solid #2ecc71',
      }}
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
          />
          <button onClick={handleEdit} style={{ marginRight: '8px' }}>
            Сохранить
          </button>
          <button onClick={() => setIsEditing(false)}>Отмена</button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(task.id)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#999' : 'inherit' }}>
              {task.text}
            </span>
          </div>
          {task.priority && (
            <span style={{
              fontSize: '12px',
              padding: '2px 6px',
              borderRadius: '12px',
              backgroundColor: task.priority === 'high' ? '#e74c3c' : 
                              task.priority === 'medium' ? '#f39c12' : '#2ecc71',
              color: 'white'
            }}>
              {task.priority === 'high' ? 'Не важно' : 
               task.priority === 'medium' ? 'Нормально' : 'Важно'}
            </span>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <button onClick={() => setIsEditing(true)}>Редактировать</button>
            <button className="delete-btn" onClick={() => onDelete(task.id)}>
              Удалить
            </button>
          </div>
        </>
      )}
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

  // Функции для управления задачами
  const addTask = (columnId, text, priority = 'low') => {
    const newTask = {
      id: Date.now(),
      text,
      completed: false,
      priority
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeColumn = Object.keys(columns).find(key =>
      columns[key].some(task => task.id === active.id)
    );
    const overColumn = over.id;

    if (activeColumn === overColumn) {
      // Перетаскивание внутри одной колонки
      const tasks = columns[activeColumn];
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      setColumns(prev => ({
        ...prev,
        [activeColumn]: arrayMove(tasks, oldIndex, newIndex)
      }));
    } else {
      // Перетаскивание между колонками
      const activeTask = columns[activeColumn].find(t => t.id === active.id);
      setColumns(prev => {
        const newActiveTasks = prev[activeColumn].filter(t => t.id !== active.id);
        const newOverTasks = [...prev[overColumn], activeTask];
        return {
          ...prev,
          [activeColumn]: newActiveTasks,
          [overColumn]: newOverTasks
        };
      });
    }
  };

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <h1>Моя Kanban-доска</h1>
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? 'Светлая тема' : 'Тёмная тема'}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {Object.entries(columns).map(([columnId, tasks]) => (
            <div key={columnId} className={`column ${columnId}`}>
              <div className="column-header">
                <h3>{columnId === 'todo' ? 'Задачи' : columnId === 'inProgress' ? 'В работе' : 'Готово'}</h3>
                <div>
                  <button onClick={() => addTask(columnId, 'Новая задача')}>
                    + Добавить задачу
                  </button>
                </div>
              </div>
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="task-list">
                  {tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTask(task.id, columnId)}
                      onDelete={() => deleteTask(task.id, columnId)}
                      onEdit={(id, text) => editTask(id, text, columnId)}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}

export default App;