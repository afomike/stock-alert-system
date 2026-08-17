import api from './api';

export async function getDashboardMetrics() {
  const { data } = await api.get('/inventory/dashboard');
  return data;
}

export async function getTrend(days = 14) {
  const { data } = await api.get('/inventory/trend', { params: { days } });
  return data;
}

export async function getLowStock() {
  const { data } = await api.get('/inventory/low-stock');
  return data;
}

export async function getPredictions() {
  const { data } = await api.get('/inventory/predictions');
  return data;
}

export async function getAiPredictions() {
  const { data } = await api.get('/inventory/ai-predictions');
  return data;
}

export async function getAiReorderRecommendations(onlyNeeded = true) {
  const { data } = await api.get('/inventory/ai-reorder', { params: { only_needed: onlyNeeded } });
  return data;
}

export async function getReorderReports() {
  const { data } = await api.get('/inventory/reorder-reports');
  return data;
}

export async function recordMovement(payload) {
  const { data } = await api.post('/inventory/movements', payload);
  return data;
}

export async function getMovementsForProduct(productId) {
  const { data } = await api.get(`/inventory/movements/${productId}`);
  return data;
}

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}
