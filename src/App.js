import './App.css'
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

// 🔐 Замените на ваш URL и анонимный ключ из проекта Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
//const supabase = createClient(
//  process.env.REACT_APP_SUPABASE_URL,
//  process.env.REACT_APP_SUPABASE_ANON_KEY
//);

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
function TaskCard({ task, user, onToggle, onDelete, onEdit, onUpdateAssignee, onUpdateDate, onUpdatePriority }) {
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
  const [editDate, setEditDate] = useState(task.due_date || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'idea');

  const canEdit = user.role === 'admin' || task.created_by === user.id;

  const handleEdit = async () => {
    await onEdit(task.id, editText, task.column_id, editPriority, editAssignee, editDate);
    setIsEditing(false);
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
        <div style={{ marginBottom: '4px' }}>
          <strong>👤</strong> {task.assignee}
        </div>
      )}

      {task.due_date && (
        <div style={{ marginBottom: '4px' }}>
          <strong>📅</strong> {formatDate(task.due_date)}
          {new Date(task.due_date) < new Date() && !task.completed && (
            <span style={{ color: 'red', marginLeft: '4px' }}>(просрочено)</span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
        <button onClick={() => setIsEditing(true)} disabled={!canEdit}>
          {canEdit ? 'Редактировать' : 'Нет прав'}
        </button>
        <button
          className="delete-btn"
          onClick={() => canEdit ? onDelete(task.id) : alert('Нет прав')}
          disabled={!canEdit}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

function App() {
  const [columns, setColumns] = useState({ todo: [], inProgress: [], done: [] });
  const [darkMode, setDarkMode] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [user, setUser] = useState(null); // { id, email, role: 'admin' | 'user' }
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailView, setEmailView] = useState(false); // true = показать email форму

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const email = session.user.email;
        const role = email === 'admin@example.com' ? 'admin' : 'user';
        setUser({ id: session.user.id, email, role });
      }
      setLoading(false);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const email = session.user.email;
        const role = email === 'admin@example.com' ? 'admin' : 'user';
        setUser({ id: session.user.id, email, role });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchTasks = async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) console.error(error);
      else {
        const grouped = { todo: [], inProgress: [], done: [] };
        data.forEach(task => {
          grouped[task.column_id].push(task);
        });
        setColumns(grouped);
      }
    };
    fetchTasks();
  }, [user]);

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
  };

  const addTask = async (columnId, text, priority = 'idea', assignee = '', dueDate = '') => {
    if (!user || !user.id) {
    alert('Пользователь не авторизован');
    return;
    }
  
    const { error } = await supabase.from('tasks').insert({
      text,
      completed: false,
      priority,
      assignee,
      due_date: dueDate,
      column_id: columnId,
      created_by: user.id,
    });
    if (!error) {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error) {
        const grouped = { todo: [], inProgress: [], done: [] };
        data.forEach(task => grouped[task.column_id].push(task));
        setColumns(grouped);
      }
    }
  };

  const toggleTask = async (id, columnId) => {
    const { error } = await supabase.from('tasks').update({ completed: !columns[columnId].find(t => t.id === id).completed }).eq('id', id);
    if (!error) {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error) {
        const grouped = { todo: [], inProgress: [], done: [] };
        data.forEach(task => grouped[task.column_id].push(task));
        setColumns(grouped);
      }
    }
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error) {
        const grouped = { todo: [], inProgress: [], done: [] };
        data.forEach(task => grouped[task.column_id].push(task));
        setColumns(grouped);
      }
    }
  };

  const editTask = async (id, newText, columnId, priority, assignee, dueDate) => {
    const { error } = await supabase.from('tasks').update({
      text: newText,
      priority,
      assignee,
      due_date: dueDate
    }).eq('id', id);
    if (!error) {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error) {
        const grouped = { todo: [], inProgress: [], done: [] };
        data.forEach(task => grouped[task.column_id].push(task));
        setColumns(grouped);
      }
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

    const { error } = await supabase.from('tasks').update({ column_id: overColumnId }).eq('id', active.id);
    if (!error) {
      const { data, error } = await supabase.from('tasks').select('*');
      if (!error) {
        const grouped = { todo: [], inProgress: [], done: [] };
        data.forEach(task => grouped[task.column_id].push(task));
        setColumns(grouped);
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
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <button onClick={logout} style={{ marginLeft: '10px' }}>
            Выйти
          </button>
        </div>
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
                      user={user}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onEdit={editTask}
                      onUpdateAssignee={() => {}}
                      onUpdateDate={() => {}}
                      onUpdatePriority={() => {}}
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