import { useState, useEffect, useCallback } from "react";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import * as api from "./services/api";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.fetchNotes();
      setNotes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreate = async ({ title, content }) => {
    try {
      await api.createNote({ title, content });
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async ({ title, content }) => {
    try {
      await api.updateNote(editingNote.id, { title, content });
      setEditingNote(null);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteNote(id);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <h1>Notes</h1>
      {error && <div className="error">{error}</div>}
      <NoteForm
        note={editingNote}
        onSubmit={editingNote ? handleUpdate : handleCreate}
        onCancel={editingNote ? () => setEditingNote(null) : null}
      />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <NoteList
          notes={notes}
          onEdit={setEditingNote}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default App;
