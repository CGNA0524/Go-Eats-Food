export const API_BASE = (() => {
  if (window.GOEATS_API_BASE) {
    return window.GOEATS_API_BASE;
  }
  if (window.location.protocol === 'file:') {
    return 'http://localhost:5000/api';
  }
  return `${window.location.origin}/api`;
})();

export async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  
  // Handle token expiration
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    throw new Error('Session expired. Please login again.');
  }
  
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload;
}

export const getJson = (path, options = {}) => request(path, { ...options, method: 'GET' });
export const postJson = (path, body, options = {}) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) });
export const putJson = (path, body, options = {}) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) });
