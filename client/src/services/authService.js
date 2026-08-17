import api from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function updateProfile(payload) {
  const { data } = await api.patch('/auth/me', payload);
  return data.user;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore — logout is a client-side no-op regardless of server response
  }
}
