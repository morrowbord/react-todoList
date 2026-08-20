import React from 'react';
import { useAuth } from '../context/AuthContext';

const Header = ({ darkMode, setDarkMode, view, setView, archivedCount }) => {
  const { user, logout } = useAuth();

  return (
    <div className="header">
      <h1>Моя Kanban-доска</h1>
      <div className="header-right">
        <span>Привет, {user.email} ({user.role})</span>
        <button
          className={`view-toggle ${view === 'kanban' ? 'active' : ''}`}
          onClick={() => setView('kanban')}
        >
          Доска
        </button>
        <button
          className={`view-toggle ${view === 'archive' ? 'active' : ''}`}
          onClick={() => setView('archive')}
        >
          Архив ({archivedCount})
        </button>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Светлая тема' : 'Тёмная тема'}
        </button>
        <button onClick={logout} className="logout-btn">
          Выйти
        </button>
      </div>
    </div>
  );
};

export default Header;
