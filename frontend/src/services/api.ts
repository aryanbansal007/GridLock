// frontend/src/services/api.ts
import { API_BASE } from '../lib/f1';

export const fetchChatHistory = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/api/history`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
};