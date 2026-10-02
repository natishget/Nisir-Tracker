export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Important for sending HttpOnly cookies
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized (maybe redirect to login or emit event)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'An error occurred while communicating with the server.');
  }

  return response.json();
}
