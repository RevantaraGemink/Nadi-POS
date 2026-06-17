export const API_BASE_URL = 'http://localhost:3000/api';

export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
    err.details = errorData.details || '';
    throw err;
  }

  return response.json();
};
