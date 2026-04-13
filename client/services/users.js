import api from './axiosAuth';

export async function createUser(data) {
  const response = await api.post('/api/users/create', data);
  return response.data;
}

export async function getUsers() {
  const response = await api.get('/api/users');
  return response.data;
}

// Admin self-delete — hard deletes all data and deactivates account
export async function selfDeleteAccount() {
  const response = await api.delete('/api/users/me');
  return response.data;
}

// Hard-delete a sub-user + all their data (admin/manager only)
export async function hardDeleteUser(id) {
  const response = await api.delete(`/api/users/${id}`);
  return response.data;
}
