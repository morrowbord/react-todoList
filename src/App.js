import './App.css';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
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
import notificationService from './services/notificationService';
import { getUserTelegramId } from './utils/userUtils';

// 🔐 Замените на ваш URL и анонимный ключ из проекта Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ ВЫНЕСЕННЫЕ ФУНКЦИИ
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
function TaskCard({ task, user, onToggle, onDelete, onEdit, onArchive, onUpdateAssignee, onUpdateDate, onUpdatePriority, startEditing = false, setEditingTaskId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [isEditing, setIsEditing] = useState(startEditing);
  
  useEffect(() => {
    setIsEditing(startEditing);
  }, [startEditing]);
  const [editText, setEditText] = useState(task.text);
  const [editAssignee, setEditAssignee] = useState(task.assignee || '');
  const [editDate, setEditDate] = useState(task.due_date || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'idea');

  const canEdit = user.role === 'admin' || task.created_by === user.id;

  const handleEdit = async () => {
    await onEdit(task.id, editText, task.column_id, editPriority, editAssignee, editDate);
    setIsEditing(false);
    // Reset the editing task ID if this was the task being automatically edited
    setEditingTaskId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  };

  if (isEditing) {
    if (!canEdit) {
      return <div>У вас нет прав для редактирования этой задачи.</div>;
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
          background: 'var(--task-bg)',
          boxShadow: 'var(--task-shadow)',
          borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
        }}
      >
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          autoFocus
          style={{ 
            width: '100%', 
            padding: '6px', 
            marginBottom: '8px',
            background: 'var(--container-bg)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px'
          }}
        />
        <select
          value={editPriority}
          onChange={(e) => setEditPriority(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '6px', 
            marginBottom: '8px',
            background: 'var(--container-bg)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px'
          }}
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
          style={{ 
            width: '100%', 
            padding: '6px', 
            marginBottom: '8px',
            background: 'var(--container-bg)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px'
          }}
        />
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value || null)}
          style={{ 
            width: '100%', 
            padding: '6px', 
            marginBottom: '8px',
            background: 'var(--container-bg)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px'
          }}
        />
        <button onClick={handleEdit} style={{ marginRight: '8px' }}>
          Сохранить
        </button>
        <button onClick={() => {
          setIsEditing(false);
          setEditingTaskId(null);
        }}>Отмена</button>
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
        background: 'var(--task-bg)',
        boxShadow: 'var(--task-shadow)',
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
        <span style={{ 
          textDecoration: task.completed ? 'line-through' : 'none', 
          color: task.completed ? '#999' : 'var(--text-color)' 
        }}>
          {task.text}
        </span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => canEdit ? onToggle(task.id, task.column_id) : alert('Нет прав')}
            style={{ marginRight: '6px' }}
            disabled={!canEdit}
          />
          Выполнено
        </label>
      </div>

      <div style={{ marginBottom: '6px' }}>
        <strong>Статус:</strong> <span style={{ color: getPriorityColor(task.priority) }}>{getPriorityLabel(task.priority)}</span>
      </div>

      {task.assignee && (
        <div style={{ marginBottom: '4px', color: '#aaa' }}>
          <strong>👤</strong> {task.assignee}
        </div>
      )}

      {task.due_date && (
        <div style={{ marginBottom: '4px', color: '#aaa' }}>
          <strong>📅</strong> {formatDate(task.due_date)}
          {new Date(task.due_date) < new Date() && !task.completed && (
            <span style={{ color: '#e74c3c', marginLeft: '4px', fontWeight: 'bold' }}>(просрочено)</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
        <button onClick={() => {
          setIsEditing(true);
          setEditingTaskId(task.id);
        }} disabled={!canEdit}>
          {canEdit ? 'Редактировать' : 'Нет прав'}
        </button>
        <button
          className="archive-btn"
          onClick={() => onArchive(task.id)}
          style={{ backgroundColor: '#f39c12', color: 'white' }}
        >
          Архивировать
        </button>
      </div>
    </div>
  );
}

function App() {
  const [columns, setColumns] = useState({ todo: [], inProgress: [], done: [] });
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null); // Track which task is being edited
  const [user, setUser] = useState(null); // { id, email, role: 'admin' | 'user' }
  const [userTelegramId, setUserTelegramId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailView, setEmailView] = useState(false); // true = показать email форму
  const [view, setView] = useState('kanban'); // 'kanban' или 'archive'

  // 🔹 Загрузка данных при старте
  useEffect(() => {
    const savedColumns = JSON.parse(localStorage.getItem('kanban-columns')) || {
      todo: [],
      inProgress: [],
      done: []
    };
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    setColumns(savedColumns);
    setDarkMode(savedDarkMode);
    setLoading(false);
  }, []);

  // 🔹 Загрузка пользователя и задач
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const email = session.user.email;
        const role = email === 'admin@example.com' ? 'admin' : 'user';
        const userId = session.user.id;
        
        setUser({ id: userId, email, role });
        
        // Fetch user's Telegram ID
        const telegramId = await getUserTelegramId(userId);
        if (telegramId) {
          setUserTelegramId(telegramId);
        }
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const email = session.user.email;
        const role = email === 'admin@example.com' ? 'admin' : 'user';
        const userId = session.user.id;
        
        setUser({ id: userId, email, role });
        
        // Fetch user's Telegram ID
        getUserTelegramId(userId).then(telegramId => {
          if (telegramId) {
            setUserTelegramId(telegramId);
          }
        });
      } else {
        setUser(null);
        setUserTelegramId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🔹 Загрузка задач при изменении пользователя
  useEffect(() => {
    if (!user) return;
    const fetchTasks = async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) console.error(error);
      else {
        const activeTasks = { todo: [], inProgress: [], done: [] };
        const archivedTasksList = [];
        
        data.forEach(task => {
          if (task.column_id === 'archived') {
            archivedTasksList.push(task);
          } else {
            activeTasks[task.column_id].push(task);
          }
        });
        
        setColumns(activeTasks);
        setArchivedTasks(archivedTasksList);
      }
    };
    fetchTasks();
  }, [user]);

  // 🔹 Сохранение + применение темы и задач
  useEffect(() => {
    localStorage.setItem('kanban-columns', JSON.stringify(columns));
    localStorage.setItem('darkMode', darkMode);
    
    // Применяем тему к <html>
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [columns, darkMode]);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error(error);
  };

  const signInWithEmail = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
  };

  const signUpWithEmail = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else alert('Проверьте вашу почту для подтверждения регистрации.');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // Clear user state and potentially redirect
    setUser(null);
  };

  const addTask = async (columnId, text, priority = 'idea', assignee = '', dueDate = null) => {
    if (!user || !user.id) {
      alert('Пользователь не авторизован');
      return;
    }

    const taskData = {
      text,
      completed: false,
      priority,
      assignee,
      column_id: columnId,
      created_by: user.id,
    };

    if (dueDate) {
      taskData.due_date = dueDate;
    }

    const { data: insertedTask, error } = await supabase.from('tasks').insert(taskData).select().single();

    if (error) {
      console.error('Ошибка при добавлении задачи:', error);
      alert('Ошибка: ' + error.message);
    } else {
      // Add the new task to the beginning of the appropriate column
      setColumns(prevColumns => {
        const newColumns = { ...prevColumns };
        newColumns[columnId] = [insertedTask, ...newColumns[columnId]];
        return newColumns;
      });
      
      // Set the new task as the one to be edited automatically
      setEditingTaskId(insertedTask.id);
      
      // Send notification about new task
      // sendNotificationSafely(notificationService.notifyTaskCreated, insertedTask, user, []);
    }
  };

  const toggleTask = async (id, columnId) => {
    const { error } = await supabase.from('tasks').update({ completed: !columns[columnId].find(t => t.id === id).completed }).eq('id', id);
    if (!error) {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error) {
        const activeTasks = { todo: [], inProgress: [], done: [] };
        const archivedTasksList = [];
        
        data.forEach(task => {
          if (task.column_id === 'archived') {
            archivedTasksList.push(task);
          } else {
            activeTasks[task.column_id].push(task);
          }
        });
        
        setColumns(activeTasks);
        setArchivedTasks(archivedTasksList);
        
        // Send notification about task completion
        const updatedTask = data.find(t => t.id === id);
        if (updatedTask && updatedTask.completed) {
          sendNotificationSafely(notificationService.notifyTaskCompleted, updatedTask, user, []);
        }
      }
    }
  };

  const archiveTask = async (id) => {
    // Update task to have a special archived column_id
    const { error } = await supabase.from('tasks').update({ column_id: 'archived' }).eq('id', id);
    if (error) {
      console.error('Error archiving task:', error);
      alert('Ошибка при архивации задачи: ' + error.message);
      return;
    }
    
    const { data, error: selectError } = await supabase.from('tasks').select('*');
    if (!selectError) {
      const activeTasks = { todo: [], inProgress: [], done: [] };
      const archivedTasksList = [];
      
      data.forEach(task => {
        if (task.column_id === 'archived') {
          archivedTasksList.push(task);
        } else {
          activeTasks[task.column_id].push(task);
        }
      });
      
      setColumns(activeTasks);
      setArchivedTasks(archivedTasksList);
      
      // Send notification about task archiving
      const archivedTask = archivedTasksList.find(t => t.id === id);
      if (archivedTask) {
        sendNotificationSafely(notificationService.notifyTaskArchived, archivedTask, user, []);
      }
    } else {
      console.error('Error fetching tasks after archiving:', selectError);
    }
  };

  const deleteTask = async (id) => {
    // First check if the task is archived before deleting
    const { data: taskData, error: fetchError } = await supabase.from('tasks').select('column_id').eq('id', id).single();
    
    if (fetchError) {
      console.error('Error fetching task:', fetchError);
      return;
    }
    
    if (taskData.column_id !== 'archived') {
      alert('Нельзя удалить задачу, которая не находится в архиве. Сначала архивируйте задачу.');
      return;
    }
    
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      const { data, error: selectError } = await supabase.from('tasks').select('*');
      if (!selectError) {
        const activeTasks = { todo: [], inProgress: [], done: [] };
        const archivedTasksList = [];
        
        data.forEach(task => {
          if (task.column_id === 'archived') {
            archivedTasksList.push(task);
          } else {
            activeTasks[task.column_id].push(task);
          }
        });
        
        setColumns(activeTasks);
        setArchivedTasks(archivedTasksList);
        
        // Send notification about task deletion
        sendNotificationSafely(notificationService.notifyTaskDeleted, { id }, user, []);
      }
    }
  };

  const editTask = async (id, newText, columnId, priority, assignee, dueDate) => {
    const taskData = {
      text: newText,
      priority,
      assignee,
    };

    if (dueDate) {
      taskData.due_date = dueDate;
    } else {
      taskData.due_date = null;
    }

    const { error } = await supabase.from('tasks').update(taskData).eq('id', id);
    if (!error) {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error) {
        const activeTasks = { todo: [], inProgress: [], done: [] };
        const archivedTasksList = [];
        
        data.forEach(task => {
          if (task.column_id === 'archived') {
            archivedTasksList.push(task);
          } else {
            activeTasks[task.column_id].push(task);
          }
        });
        
        setColumns(activeTasks);
        setArchivedTasks(archivedTasksList);
        
        // Send notification about task editing
        const updatedTask = data.find(t => t.id === id);
        if (updatedTask) {
          sendNotificationSafely(notificationService.notifyTaskEdited, updatedTask, user, []);
        }
      }
    }
  };

  // Helper function to send notifications safely without blocking task operations
  const sendNotificationSafely = async (notificationFn, ...args) => {
    try {
      // Run notification in background without blocking
      setTimeout(async () => {
        // Bind the function to the notificationService instance to maintain 'this' context
        if (typeof notificationFn === 'function') {
          await notificationFn.apply(notificationService, args);
        }
      }, 0);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw error as we don't want to break task operations
    }
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

  const handleDragEnd = async (event) => {
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

    const activeTask = columns[activeColumnId].find(t => t.id === active.id);
    if (!activeTask) return;

    if (user.role !== 'admin' && activeTask.created_by !== user.id) {
      alert('Нет прав для перемещения чужой задачи');
      return;
    }

    // Если перетаскивание между колонками
    if (activeColumnId !== overColumnId) {
      const { error } = await supabase.from('tasks').update({ column_id: overColumnId }).eq('id', active.id);
      if (!error) {
        const { data, error } = await supabase.from('tasks').select('*');
        if (!error) {
          const activeTasks = { todo: [], inProgress: [], done: [] };
          const archivedTasksList = [];
          
          data.forEach(task => {
            if (task.column_id === 'archived') {
              archivedTasksList.push(task);
            } else {
              activeTasks[task.column_id].push(task);
            }
          });
          
          // Добавляем задачу в начало целевой колонки
          activeTasks[overColumnId] = [{ ...activeTask, column_id: overColumnId }, ...activeTasks[overColumnId].filter(t => t.id !== active.id)];
          setColumns(activeTasks);
          setArchivedTasks(archivedTasksList);
          
          // Send notification about task status change
          console.log('Would send notification for task moved from', activeColumnId, 'to', overColumnId, 'task:', activeTask);
          // You could implement specific notifications based on the transition
          // e.g., if moving to 'done', send completion notification
        }
      }
    } else {
      // Перетаскивание внутри одной колонки
      const tasks = columns[activeColumnId];
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      if (oldIndex !== newIndex) {
        const newTasks = arrayMove(tasks, oldIndex, newIndex);
        setColumns(prev => ({
          ...prev,
          [activeColumnId]: newTasks
        }));
      }
    }
  };

  const stats = {
    todo: { total: columns.todo.length, completed: columns.todo.filter(t => t.completed).length },
    inProgress: { total: columns.inProgress.length, completed: columns.inProgress.filter(t => t.completed).length },
    done: { total: columns.done.length, completed: columns.done.filter(t => t.completed).length }
  };
  const totalTasks = stats.todo.total + stats.inProgress.total + stats.done.total;
  const totalCompleted = stats.todo.completed + stats.inProgress.completed + stats.done.completed;

  if (loading) return <div>Загрузка...</div>;

  if (!user) {
    return (
      <div className="container">
        <h2>Войти в систему</h2>
        <button onClick={loginWithGoogle}>Войти через Google</button>

        <div style={{ marginTop: '20px' }}>
          {!emailView ? (
            <button onClick={() => setEmailView(true)}>Войти по email</button>
          ) : (
            <div>
              <form onSubmit={signInWithEmail}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ display: 'block', marginBottom: '10px', padding: '8px' }}
                />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ display: 'block', marginBottom: '10px', padding: '8px' }}
                />
                <button type="submit">Войти</button>
              </form>
              <p>Нет аккаунта? <button onClick={signUpWithEmail}>Зарегистрироваться</button></p>
              <button onClick={() => setEmailView(false)}>Назад</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <h1>Моя Kanban-доска</h1>
        <div>
          <span>Привет, {user.email} ({user.role})</span>
          <button 
            className={`view-toggle ${view === 'kanban' ? 'active' : ''}`} 
            onClick={() => setView('kanban')}
            style={{ marginLeft: '10px' }}
          >
            Доска
          </button>
          <button 
            className={`view-toggle ${view === 'archive' ? 'active' : ''}`} 
            onClick={() => setView('archive')}
            style={{ marginLeft: '5px' }}
          >
            Архив ({archivedTasks.length})
          </button>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <button onClick={logout} style={{ marginLeft: '10px' }}>
            Выйти
          </button>
        </div>
      </div>

      {view === 'kanban' && (
        <>
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
                          user={user}
                          onToggle={toggleTask}
                          onDelete={deleteTask}
                          onEdit={editTask}
                          onArchive={archiveTask}
                          onUpdateAssignee={() => {}}
                          onUpdateDate={() => {}}
                          onUpdatePriority={() => {}}
                          startEditing={editingTaskId === task.id}
                          setEditingTaskId={setEditingTaskId}
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
                  background: 'var(--task-bg)',
                  borderRadius: '6px',
                  boxShadow: 'var(--task-shadow)',
                  borderLeft: `4px solid ${getPriorityColor(activeTask.priority)}`,
                }}>
                  {activeTask.text}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {view === 'archive' && (
        <div className="archive-view">
          <h2>Архив задач</h2>
          <div className="archived-tasks-list">
            {archivedTasks.length === 0 ? (
              <p>Нет архивированных задач</p>
            ) : (
              archivedTasks.map(task => (
                <div key={task.id} className="archived-task-card" style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  background: 'var(--task-bg)',
                  boxShadow: 'var(--task-shadow)',
                  borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>{task.text}</strong>
                    {task.completed && <span style={{ marginLeft: '8px', color: '#27ae60' }}>✓ Выполнено</span>}
                  </div>
                  
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Статус:</strong> <span style={{ color: getPriorityColor(task.priority) }}>{getPriorityLabel(task.priority)}</span>
                  </div>

                  {task.assignee && (
                    <div style={{ marginBottom: '4px', color: '#aaa' }}>
                      <strong>👤</strong> {task.assignee}
                    </div>
                  )}

                  {task.due_date && (
                    <div style={{ marginBottom: '4px', color: '#aaa' }}>
                      <strong>📅</strong> {new Date(task.due_date).toLocaleDateString('ru-RU')}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                    <button 
                      onClick={async () => {
                        // Restore task from archive
                        const { error } = await supabase.from('tasks').update({ column_id: 'todo' }).eq('id', task.id);
                        if (!error) {
                          const { data, error: selectError } = await supabase.from('tasks').select('*');
                          if (!selectError) {
                            const activeTasks = { todo: [], inProgress: [], done: [] };
                            const archivedTasksList = [];
                            
                            data.forEach(task => {
                              if (task.column_id === 'archived') {
                                archivedTasksList.push(task);
                              } else {
                                activeTasks[task.column_id].push(task);
                              }
                            });
                            
                            setColumns(activeTasks);
                            setArchivedTasks(archivedTasksList);
                          }
                        }
                      }}
                      style={{ backgroundColor: '#3498db', color: 'white' }}
                    >
                      Восстановить
                    </button>
                    <button
                      className="delete-btn"
                      onClick={async () => {
                        // Delete task permanently
                        const { error } = await supabase.from('tasks').delete().eq('id', task.id);
                        if (!error) {
                          const { data, error: selectError } = await supabase.from('tasks').select('*');
                          if (!selectError) {
                            const activeTasks = { todo: [], inProgress: [], done: [] };
                            const archivedTasksList = [];
                            
                            data.forEach(task => {
                              if (task.column_id === 'archived') {
                                archivedTasksList.push(task);
                              } else {
                                activeTasks[task.column_id].push(task);
                              }
                            });
                            
                            setColumns(activeTasks);
                            setArchivedTasks(archivedTasksList);
                          }
                        }
                      }}
                    >
                      Удалить навсегда
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;