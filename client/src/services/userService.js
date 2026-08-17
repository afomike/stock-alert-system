import api from './api';

export async function getUsers() { const { data } = await api.get('/users'); return data.users; }
export async function createUser(payload) { const { data } = await api.post('/users', payload); return data.user; }
export async function updateUser(id, payload) { const { data } = await api.patch(`/users/${id}`, payload); return data.user; }
