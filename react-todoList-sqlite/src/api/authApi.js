import apiClient from './apiClient';

export const login = async (email, password) => {
  return apiClient.post('/auth/login', { email, password });
};

export const register = async (email, password) => {
  return apiClient.post('/auth/register', { email, password });
};

export const getMe = async () => {
  return apiClient.get('/auth/me');
};
