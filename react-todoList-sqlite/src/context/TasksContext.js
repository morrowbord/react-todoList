import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as tasksApi from '../api/tasksApi';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const TasksContext = createContext(null);

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

// Helper to send notifications without blocking
const sendNotificationSafely = async (notificationFn, ...args) => {
  try {
    setTimeout(async () => {
      if (typeof notificationFn === 'function') {
        await notificationFn.apply(notificationService, args);
      }
    }, 0);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

const PRIORITY_ORDER = { urgent: 0, notImportant: 1, idea: 2 };

export const TasksProvider = ({ children }) => {
  const { user } = useAuth();
  const [columns, setColumns] = useState({ todo: [], inProgress: [], done: [] });
  const [archivedTasks, setArchivedTasks] = useState([]);

  // ── Filters & Sort ──
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at_desc');

  // Fetch all tasks when user is authenticated
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setColumns({ todo: [], inProgress: [], done: [] });
      setArchivedTasks([]);
      return;
    }

    try {
      const [activeData, archivedData] = await Promise.all([
        tasksApi.getTasks(),
        tasksApi.getArchivedTasks(),
      ]);

      const activeTasks = { todo: [], inProgress: [], done: [] };
      activeData.forEach(task => {
        if (task.column_id in activeTasks) {
          activeTasks[task.column_id].push(task);
        }
      });
      setColumns(activeTasks);
      setArchivedTasks(archivedData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setColumns({ todo: [], inProgress: [], done: [] });
      setArchivedTasks([]);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (columnId, text, priority = 'idea', assignee = '', dueDate = null) => {
    if (!user) throw new Error('Not authenticated');

    const taskData = { text, completed: false, priority, assignee, column_id: columnId };
    if (dueDate) taskData.due_date = dueDate;

    const newTask = await tasksApi.createTask(taskData);
    setColumns(prev => ({
      ...prev,
      [columnId]: [newTask, ...prev[columnId]],
    }));
    return newTask;
  };

  const toggleTask = async (id) => {
    // Optimistic update
    setColumns(prev => {
      const newColumns = { ...prev };
      for (const colId in newColumns) {
        const taskIndex = newColumns[colId].findIndex(t => t.id === id);
        if (taskIndex !== -1) {
          newColumns[colId] = [...newColumns[colId]];
          newColumns[colId][taskIndex] = {
            ...newColumns[colId][taskIndex],
            completed: !newColumns[colId][taskIndex].completed,
          };
          break;
        }
      }
      return newColumns;
    });

    try {
      const updatedTask = await tasksApi.toggleTask(id);
      setColumns(prev => {
        const newColumns = { ...prev };
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

      if (updatedTask.completed) {
        sendNotificationSafely(notificationService.notifyTaskCompleted, updatedTask, user, [user]);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      fetchTasks(); // Revert on error
    }
  };

  const editTask = async (id, newText, columnId, priority, assignee, dueDate) => {
    // Find current completed status
    let currentCompleted = false;
    for (const colId in columns) {
      const task = columns[colId].find(t => t.id === id);
      if (task) { currentCompleted = task.completed; break; }
    }

    const taskData = {
      text: newText,
      completed: currentCompleted,
      priority,
      assignee,
      due_date: dueDate || null,
      column_id: columnId,
    };

    const updatedTask = await tasksApi.updateTask(id, taskData);
    setColumns(prev => {
      const newColumns = { ...prev };
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

    sendNotificationSafely(notificationService.notifyTaskEdited, updatedTask, user, [user]);
    return updatedTask;
  };

  const archiveTaskById = async (id) => {
    const archivedTask = await tasksApi.archiveTask(id);
    setColumns(prev => {
      const newColumns = { ...prev };
      for (const colId in newColumns) {
        newColumns[colId] = newColumns[colId].filter(t => t.id !== id);
      }
      return newColumns;
    });
    setArchivedTasks(prev => [...prev, archivedTask]);
    sendNotificationSafely(notificationService.notifyTaskArchived, archivedTask, user, [user]);
    return archivedTask;
  };

  const deleteTaskById = async (id) => {
    await tasksApi.deleteTask(id);
    setArchivedTasks(prev => prev.filter(t => t.id !== id));
    sendNotificationSafely(notificationService.notifyTaskDeleted, { id }, user, [user]);
  };

  const restoreTask = async (task) => {
    const updatedTask = await tasksApi.updateTask(task.id, {
      text: task.text,
      completed: task.completed,
      priority: task.priority,
      assignee: task.assignee,
      due_date: task.due_date,
      column_id: 'todo',
      created_by: task.created_by,
    });
    setArchivedTasks(prev => prev.filter(t => t.id !== task.id));
    setColumns(prev => ({
      ...prev,
      todo: [updatedTask, ...prev.todo],
    }));
    return updatedTask;
  };

  const moveTask = async (taskId, targetColumnId) => {
    // Find task in columns
    let taskObj = null;
    let sourceColumnId = null;
    for (const colId in columns) {
      const found = columns[colId].find(t => t.id === taskId);
      if (found) { taskObj = found; sourceColumnId = colId; break; }
    }
    if (!taskObj) return;

    // Optimistic update
    setColumns(prev => {
      const newColumns = { ...prev };
      newColumns[sourceColumnId] = newColumns[sourceColumnId].filter(t => t.id !== taskId);
      newColumns[targetColumnId] = [{ ...taskObj, column_id: targetColumnId }, ...newColumns[targetColumnId]];
      return newColumns;
    });

    try {
      const updatedTask = await tasksApi.updateTask(taskId, {
        text: taskObj.text,
        completed: taskObj.completed,
        priority: taskObj.priority,
        assignee: taskObj.assignee,
        due_date: taskObj.due_date,
        column_id: targetColumnId,
        created_by: taskObj.created_by,
      });

      // Replace with server response
      setColumns(prev => {
        const newColumns = { ...prev };
        newColumns[targetColumnId] = newColumns[targetColumnId].map(t =>
          t.id === taskId ? updatedTask : t
        );
        return newColumns;
      });
    } catch (error) {
      console.error('Error moving task:', error);
      fetchTasks(); // Revert on error
    }
  };

  const reorderInColumn = (columnId, oldIndex, newIndex) => {
    if (oldIndex === newIndex) return;
    setColumns(prev => {
      const tasks = [...prev[columnId]];
      const [moved] = tasks.splice(oldIndex, 1);
      tasks.splice(newIndex, 0, moved);
      return { ...prev, [columnId]: tasks };
    });
  };

  // ── Derived filtered/sorted columns ──
  const filteredColumns = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const matchesFilters = (task) => {
      // Text search (name + assignee)
      if (query) {
        const text = (task.text || '').toLowerCase();
        const assignee = (task.assignee || '').toLowerCase();
        if (!text.includes(query) && !assignee.includes(query)) return false;
      }
      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      // Status filter
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'active' && task.completed) return false;
      return true;
    };

    const sortTasks = (tasks) => {
      const sorted = [...tasks];
      switch (sortBy) {
        case 'created_at_desc':
          sorted.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
        case 'created_at_asc':
          sorted.sort((a, b) => (a.id || 0) - (b.id || 0)); break;
        case 'priority':
          sorted.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)); break;
        case 'name':
          sorted.sort((a, b) => (a.text || '').localeCompare(b.text || '', 'ru')); break;
        default: break;
      }
      return sorted;
    };

    return {
      todo: sortTasks(columns.todo.filter(matchesFilters)),
      inProgress: sortTasks(columns.inProgress.filter(matchesFilters)),
      done: sortTasks(columns.done.filter(matchesFilters)),
    };
  }, [columns, searchQuery, priorityFilter, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
    setSortBy('created_at_desc');
  };

  const hasActiveFilters = searchQuery || priorityFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'created_at_desc';

  const value = {
    columns,
    filteredColumns,
    archivedTasks,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters,
    addTask,
    toggleTask,
    editTask,
    archiveTask: archiveTaskById,
    deleteTask: deleteTaskById,
    restoreTask,
    moveTask,
    reorderInColumn,
    fetchTasks,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};
