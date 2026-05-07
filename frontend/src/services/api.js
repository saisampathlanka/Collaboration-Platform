const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchNotes() {
  const res = await fetch(`${API_URL}/notes`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

export async function createNote({ title, content }) {
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
}

export async function updateNote(id, { title, content, version }) {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
  });
  if (!res.ok) throw new Error('Failed to delete note');
}
