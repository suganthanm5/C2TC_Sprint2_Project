// src/api.js
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080/orderservice';

export async function apiFetch(path = '', options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
