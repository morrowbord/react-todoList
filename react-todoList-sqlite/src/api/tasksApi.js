import apiClient from './apiClient';

export const getTasks = async () => {
  return apiClient.get('/tasks');
};

export const getArchivedTasks = async () => {
  return apiClient.get('/tasks/archived');
};

export const getTaskById = async (id) => {
  return apiClient.get(`/tasks/${id}`);
};

export const createTask = async (taskData) => {
  return apiClient.post('/tasks', taskData);
};

export const updateTask = async (id, taskData) => {
  return apiClient.put(`/tasks/${id}`, taskData);
};

export const toggleTask = async (id) => {
  return apiClient.put(`/tasks/${id}/toggle`);
};

export const archiveTask = async (id) => {
  return apiClient.put(`/tasks/${id}/archive`);
};

export const deleteTask = async (id) => {
  return apiClient.delete(`/tasks/${id}`);
};
