// frontend/src/services/api.ts
export const fetchChatHistory = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5050/api/history', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Failed to fetch history");
  return response.json();
};