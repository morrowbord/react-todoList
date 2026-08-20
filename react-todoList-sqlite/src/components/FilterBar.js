import React from 'react';
import { useTasks } from '../context/TasksContext';

const FilterBar = () => {
  const {
    searchQuery, setSearchQuery,
    priorityFilter, setPriorityFilter,
    statusFilter, setStatusFilter,
    sortBy, setSortBy,
    clearFilters, hasActiveFilters,
  } = useTasks();

  return (
    <div className="filter-bar">
      <div className="filter-bar-row">
        <div className="filter-group">
          <label className="filter-label">🔍 Поиск</label>
          <input
            type="text"
            className="filter-search-input"
            placeholder="Задача или исполнитель…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Приоритет</label>
          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="urgent">Срочно</option>
            <option value="notImportant">Проект</option>
            <option value="idea">Идея</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Статус</label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="active">В работе</option>
            <option value="completed">Выполнено</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Сортировка</label>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at_desc">Новые первые</option>
            <option value="created_at_asc">Старые первые</option>
            <option value="priority">По приоритету</option>
            <option value="name">По имени</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button className="filter-clear-btn" onClick={clearFilters}>
            ✕ Сбросить
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
