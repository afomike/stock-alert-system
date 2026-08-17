import api from './api';

export async function getSuppliers(params = {}) {
  const { data } = await api.get('/suppliers', { params });
  return data;
}

export async function createSupplier(payload) {
  const { data } = await api.post('/suppliers', payload);
  return data;
}

export async function updateSupplier(id, payload) {
  const { data } = await api.put(`/suppliers/${id}`, payload);
  return data;
}

export async function deleteSupplier(id) {
  await api.delete(`/suppliers/${id}`);
}
