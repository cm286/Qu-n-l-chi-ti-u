const API_URL = import.meta.env.VITE_API_URL || 'https://qu-n-l-chi-ti-u.onrender.com/api/v2/auth';

export const registerUser = async (payload) => {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const loginUser = async (payload) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};
