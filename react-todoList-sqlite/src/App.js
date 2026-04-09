import './App.css';
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
import notificationService from './services/notificationService';
import { getUserTelegramId } from './utils/userUtils';

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

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
        <span
          data-completed={task.completed}
          style={{
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? '#999' : 'var(--text-color)',
            transition: 'all 0.2s ease'
          }}
        >
          {task.text}
        </span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => canEdit ? onToggle(task.id) : alert('Нет прав')}
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
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);

    // Verify token and load user from localStorage if available and valid
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      // Verify the token by making a simple request to the server
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          // Token is valid, set the user
          setUser(JSON.parse(savedUser));
        } else {
          // Token is invalid/expired, clear localStorage and reset user
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          // Also reset tasks when user is logged out
          setColumns({ todo: [], inProgress: [], done: [] });
          setArchivedTasks([]);
        }
      })
      .catch(error => {
        console.error('Error verifying token:', error);
        // On network error, clear localStorage and reset user
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        // Also reset tasks when user is logged out
        setColumns({ todo: [], inProgress: [], done: [] });
        setArchivedTasks([]);
      });
    } else {
      // No token or saved user, ensure clean state
      setUser(null);
      setColumns({ todo: [], inProgress: [], done: [] });
      setArchivedTasks([]);
    }

    setLoading(false);
  }, []);

  // 🔹 Загрузка задач при изменении пользователя
  useEffect(() => {
    if (!user) {
      // If no user, ensure clean state
      console.log('No user, resetting tasks state');
      setColumns({ todo: [], inProgress: [], done: [] });
      setArchivedTasks([]);
      return;
    }
    
    console.log('User authenticated, fetching tasks for user:', user.email);
    
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched active tasks:', data);
          const activeTasks = { todo: [], inProgress: [], done: [] };

          data.forEach(task => {
            if (task.column_id === 'archived') {
              // This shouldn't happen for active tasks, but just in case
            } else {
              activeTasks[task.column_id].push(task);
            }
          });

          setColumns(activeTasks);
        } else {
          console.error('Failed to fetch tasks:', response.statusText);
          // Even if fetch fails, ensure we have a clean state
          setColumns({ todo: [], inProgress: [], done: [] });
        }

        // Also fetch archived tasks
        const archivedResponse = await fetch(`${API_BASE_URL}/tasks/archived`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (archivedResponse.ok) {
          const archivedData = await archivedResponse.json();
          console.log('Fetched archived tasks:', archivedData);
          setArchivedTasks(archivedData);
        } else {
          console.error('Failed to fetch archived tasks:', archivedResponse.statusText);
          // Ensure archived tasks are cleared if fetch fails
          setArchivedTasks([]);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        // On error, ensure clean state
        setColumns({ todo: [], inProgress: [], done: [] });
        setArchivedTasks([]);
      }
    };
    
    // Always fetch tasks from database when user is authenticated
    fetchTasks();
  }, [user]);

  // 🔹 Принудительная загрузка задач при монтировании компонента
  useEffect(() => {
    if (user) {
      console.log('Component mounted with authenticated user, reloading tasks from DB');
      // Trigger reload of tasks when component mounts with an authenticated user
      const fetchTasks = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Fetched active tasks on mount:', data);
            const activeTasks = { todo: [], inProgress: [], done: [] };

            data.forEach(task => {
              if (task.column_id === 'archived') {
                // This shouldn't happen for active tasks, but just in case
              } else {
                activeTasks[task.column_id].push(task);
              }
            });

            setColumns(activeTasks);
          } else {
            console.error('Failed to fetch tasks on mount:', response.statusText);
            setColumns({ todo: [], inProgress: [], done: [] });
          }

          // Also fetch archived tasks
          const archivedResponse = await fetch(`${API_BASE_URL}/tasks/archived`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (archivedResponse.ok) {
            const archivedData = await archivedResponse.json();
            console.log('Fetched archived tasks on mount:', archivedData);
            setArchivedTasks(archivedData);
          } else {
            console.error('Failed to fetch archived tasks on mount:', archivedResponse.statusText);
            setArchivedTasks([]);
          }
        } catch (error) {
          console.error('Error fetching tasks on mount:', error);
          setColumns({ todo: [], inProgress: [], done: [] });
          setArchivedTasks([]);
        }
      };
      
      fetchTasks();
    }
  }, []); // Empty dependency array means this runs once when component mounts

  // 🔹 Сохранение + применение темы
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);

    // Применяем тему к <html>
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        // Fetch user's Telegram ID
        const telegramId = await getUserTelegramId(data.user.id);
        if (telegramId) {
          setUserTelegramId(telegramId);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error during login');
    }
  };

  const register = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        
        // Fetch user's Telegram ID
        const telegramId = await getUserTelegramId(data.user.id);
        if (telegramId) {
          setUserTelegramId(telegramId);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error during registration');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserTelegramId(null);
    // Also reset tasks when logging out
    setColumns({ todo: [], inProgress: [], done: [] });
    setArchivedTasks([]);
  };

  const addTask = async (columnId, text, priority = 'idea', assignee = '', dueDate = null) => {
    if (!user || !user.id) {
      alert('Пользователь не авторизован');
      return;
    }

    try {
      const taskData = {
        text,
        completed: false,
        priority,
        assignee,
        column_id: columnId,
      };

      if (dueDate) {
        taskData.due_date = dueDate;
      }

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();

        // Add the new task to the beginning of the appropriate column
        setColumns(prevColumns => {
          const newColumns = { ...prevColumns };
          newColumns[columnId] = [newTask, ...newColumns[columnId]];
          return newColumns;
        });

        // Set the new task as the one to be edited automatically
        setEditingTaskId(newTask.id);

        // Send notification about new task
        // sendNotificationSafely(notificationService.notifyTaskCreated, newTask, user, []);
      } else {
        console.error('Error adding task:', response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        alert('Ошибка: ' + response.statusText);
      }
    } catch (error) {
      console.error('Ошибка при добавлении задачи:', error);
      alert('Ошибка сети при добавлении задачи');
    }
  };

  const toggleTask = async (id) => {
    try {
      // Optimistically update the UI
      setColumns(prevColumns => {
        const newColumns = { ...prevColumns };
        for (const colId in newColumns) {
          const taskIndex = newColumns[colId].findIndex(t => t.id === id);
          if (taskIndex !== -1) {
            // Create a copy of the task with toggled completed status
            newColumns[colId] = [...newColumns[colId]];
            newColumns[colId][taskIndex] = {
              ...newColumns[colId][taskIndex],
              completed: !newColumns[colId][taskIndex].completed
            };
            break;
          }
        }
        return newColumns;
      });

      // Then make the API call
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const updatedTask = await response.json();

        // Update with the server response to ensure consistency
        setColumns(prevColumns => {
          const newColumns = { ...prevColumns };
          for (const colId in newColumns) {
            const taskIndex = newColumns[colId].findIndex(t => t.id === id);
            if (taskIndex !== -1) {
              newColumns[colId] = [...newColumns[colId]];
              newColumns[colId][taskIndex] = updatedTask;
              break;
            }
          }
          return newColumns;
        });

        // Send notification about task completion
        if (updatedTask.completed) {
          sendNotificationSafely(notificationService.notifyTaskCompleted, updatedTask, user, [user]);
        }
      } else {
        // Revert the optimistic update if API call fails
        console.error('Error toggling task:', response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        
        // Reload tasks from server to revert the change
        const fetchResponse = await fetch(`${API_BASE_URL}/tasks`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          const activeTasks = { todo: [], inProgress: [], done: [] };
          data.forEach(task => {
            if (task.column_id !== 'archived') {
              activeTasks[task.column_id].push(task);
            }
          });
          setColumns(activeTasks);
        }
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const archiveTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const archivedTask = await response.json();

        // Remove from active columns and add to archived
        setColumns(prevColumns => {
          const newColumns = { ...prevColumns };
          for (const colId in newColumns) {
            newColumns[colId] = newColumns[colId].filter(t => t.id !== id);
          }
          return newColumns;
        });

        setArchivedTasks(prev => [...prev, archivedTask]);

        // Send notification about task archiving
        sendNotificationSafely(notificationService.notifyTaskArchived, archivedTask, user, [user]);
      } else {
        console.error('Error archiving task:', response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        alert('Ошибка при архивации задачи: ' + response.statusText);
      }
    } catch (error) {
      console.error('Error archiving task:', error);
      alert('Ошибка сети при архивации задачи');
    }
  };

  const deleteTask = async (id) => {
    // First check if the task is archived before deleting
    const isArchived = archivedTasks.some(t => t.id === id);

    if (!isArchived) {
      alert('Нельзя удалить задачу, которая не находится в архиве. Сначала архивируйте задачу.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Remove from archived tasks
        setArchivedTasks(prev => prev.filter(t => t.id !== id));

        // Send notification about task deletion
        sendNotificationSafely(notificationService.notifyTaskDeleted, { id }, user, [user]);
      } else {
        console.error('Error deleting task:', response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const editTask = async (id, newText, columnId, priority, assignee, dueDate) => {
    try {
      // Find the current task to preserve the 'completed' status
      let currentCompletedStatus = false;
      for (const colId in columns) {
        const task = columns[colId].find(t => t.id === id);
        if (task) {
          currentCompletedStatus = task.completed;
          break;
        }
      }

      const taskData = {
        text: newText,
        completed: currentCompletedStatus, // Preserve the current completed status
        priority,
        assignee,
        due_date: dueDate || null,
        column_id: columnId
      };

      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const updatedTask = await response.json();

        // Update the task in the state with proper immutability
        setColumns(prevColumns => {
          const newColumns = { ...prevColumns };
          for (const colId in newColumns) {
            const taskIndex = newColumns[colId].findIndex(t => t.id === id);
            if (taskIndex !== -1) {
              newColumns[colId] = [...newColumns[colId]];
              newColumns[colId][taskIndex] = updatedTask;
              break;
            }
          }
          return newColumns;
        });

        // Send notification about task editing
        sendNotificationSafely(notificationService.notifyTaskEdited, updatedTask, user, [user]);
      } else {
        console.error('Error editing task:', response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error editing task:', error);
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

    const activeTaskObj = columns[activeColumnId].find(t => t.id === active.id);
    if (!activeTaskObj) return;

    if (user.role !== 'admin' && activeTaskObj.created_by !== user.id) {
      alert('Нет прав для перемещения чужой задачи');
      return;
    }

    // Если перетаскивание между колонками
    if (activeColumnId !== overColumnId) {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${active.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            text: activeTaskObj.text,
            completed: activeTaskObj.completed,
            priority: activeTaskObj.priority,
            assignee: activeTaskObj.assignee,
            due_date: activeTaskObj.due_date,
            column_id: overColumnId,
            created_by: activeTaskObj.created_by
          }),
        });

        if (response.ok) {
          const updatedTask = await response.json();

          // Update the state - ensure proper immutability
          setColumns(prev => {
            const newColumns = { ...prev };

            // Remove from old column
            newColumns[activeColumnId] = newColumns[activeColumnId].filter(t => t.id !== active.id);

            // Add to new column at the beginning
            newColumns[overColumnId] = [updatedTask, ...newColumns[overColumnId]];

            return newColumns;
          });
          
          // Force reload from server to ensure data consistency
          const fetchResponse = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            const activeTasks = { todo: [], inProgress: [], done: [] };
            data.forEach(task => {
              if (task.column_id !== 'archived') {
                activeTasks[task.column_id].push(task);
              }
            });
            setColumns(activeTasks);
          }
        } else {
          console.error('Error updating task position:', response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          
          // Reload tasks from server on error
          const fetchResponse = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            const activeTasks = { todo: [], inProgress: [], done: [] };
            data.forEach(task => {
              if (task.column_id !== 'archived') {
                activeTasks[task.column_id].push(task);
              }
            });
            setColumns(activeTasks);
          }
        }
      } catch (error) {
        console.error('Error updating task position:', error);
        
        // Reload tasks from server on error
        const fetchResponse = await fetch(`${API_BASE_URL}/tasks`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          const activeTasks = { todo: [], inProgress: [], done: [] };
          data.forEach(task => {
            if (task.column_id !== 'archived') {
              activeTasks[task.column_id].push(task);
            }
          });
          setColumns(activeTasks);
        }
      }
    } else {
      // Перетаскивание внутри одной колонки
      const tasks = columns[activeColumnId];
      const oldIndex = tasks.findIndex(t => t.id === active.id);
      const newIndex = tasks.findIndex(t => t.id === over.id);
      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
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
        <div style={{ marginTop: '20px' }}>
          {!emailView ? (
            <div>
              <p>Для входа используйте учетную запись:</p>
              <p>Email: admin@example.com</p>
              <p>Пароль: admin123</p>
              <button onClick={() => setEmailView(true)}>Войти</button>
            </div>
          ) : (
            <div>
              <form onSubmit={(e) => {
                e.preventDefault();
                login(email, password);
              }}>
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
              <p>Нет аккаунта? <button onClick={() => {
                register(email, password);
              }}>Зарегистрироваться</button></p>
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
                        try {
                          const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                              text: task.text,
                              completed: task.completed,
                              priority: task.priority,
                              assignee: task.assignee,
                              due_date: task.due_date,
                              column_id: 'todo',  // Move to 'todo' column
                              created_by: task.created_by
                            }),
                          });

                          if (response.ok) {
                            const updatedTask = await response.json();

                            // Remove from archived and add to active
                            setArchivedTasks(prev => prev.filter(t => t.id !== task.id));
                            setColumns(prev => ({
                              ...prev,
                              todo: [updatedTask, ...prev.todo]
                            }));
                          } else {
                            console.error('Error restoring task:', response.statusText);
                            const errorText = await response.text();
                            console.error('Error details:', errorText);
                          }
                        } catch (error) {
                          console.error('Error restoring task:', error);
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
                        await deleteTask(task.id);
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