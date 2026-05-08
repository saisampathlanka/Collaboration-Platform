const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let authToken = null;

export function setToken(token) {
  authToken = token;
}

export function getToken() {
  return authToken;
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

export async function signup(email, password) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Signup failed');
  }
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to get user');
  return res.json();
}

export async function fetchNotes() {
  const res = await fetch(`${API_URL}/notes`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

export async function createNote({ title, content }) {
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
}

export async function updateNote(id, { title, content, version }) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ title, content, version }),
  });

  if (res.status === 409) {
    const data = await res.json();
    const error = new Error(data.error);
    error.status = 409;
    error.noteId = data.noteId;
    error.clientVersion = data.clientVersion;
    error.currentVersion = data.currentVersion;
    throw error;
  }

  if (!res.ok) throw new Error('Failed to update note');
  return res.json();
}

export async function deleteNote(id) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete note');
}
