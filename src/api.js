// src/api.js
const API = import.meta.env.VITE_API_URL || '';

export function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Ensure no double slash
  const url = endpoint.startsWith('/') ? `${API}${endpoint}` : `${API}/${endpoint}`;
  return fetch(url, { ...options, headers });
}
