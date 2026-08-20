import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TasksProvider, useTasks } from './context/TasksContext';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import KanbanBoard from './components/KanbanBoard';
import ArchiveView from './components/ArchiveView';
import FilterBar from './components/FilterBar';
import './App.css';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { columns, archivedTasks, filteredColumns, hasActiveFilters } = useTasks();
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState('kanban');
  const [editingTaskId, setEditingTaskId] = useState(null);

  // Load and apply dark mode
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (authLoading) return <div className="loading">Загрузка...</div>;
  if (!user) return <LoginForm />;

  // Calculate stats from filtered columns (reflects current search/filter)
  const displayColumns = filteredColumns;
  const totalFiltered = displayColumns.todo.length + displayColumns.inProgress.length + displayColumns.done.length;
  const completedFiltered = displayColumns.todo.filter(t => t.completed).length
    + displayColumns.inProgress.filter(t => t.completed).length
    + displayColumns.done.filter(t => t.completed).length;
  // Total counts (always from raw columns)
  const totalAll = columns.todo.length + columns.inProgress.length + columns.done.length;
  const completedAll = columns.todo.filter(t => t.completed).length
    + columns.inProgress.filter(t => t.completed).length
    + columns.done.filter(t => t.completed).length;

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        view={view}
        setView={setView}
        archivedCount={archivedTasks.length}
      />

      {view === 'kanban' && (
        <>
          <div className="stats">
            <div className="stat-card">
              <h4>Всего задач</h4>
              <p>{hasActiveFilters ? `${totalFiltered} / ${totalAll}` : totalAll}</p>
            </div>
            <div className="stat-card">
              <h4>Выполнено</h4>
              <p>{hasActiveFilters ? `${completedFiltered} / ${completedAll}` : completedAll}</p>
            </div>
            <div className="stat-card">
              <h4>Осталось</h4>
              <p>{hasActiveFilters
                ? `${totalFiltered - completedFiltered} / ${totalAll - completedAll}`
                : totalAll - completedAll}</p>
            </div>
          </div>
          <FilterBar />
          <KanbanBoard editingTaskId={editingTaskId} setEditingTaskId={setEditingTaskId} />
        </>
      )}

      {view === 'archive' && <ArchiveView />}
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <TasksProvider>
      <AppContent />
    </TasksProvider>
  </AuthProvider>
);

export default App;
