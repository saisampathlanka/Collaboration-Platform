import { useState, useEffect } from "react";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import * as api from "./services/api";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .fetchNotes()
      .then((data) => {
        if (!cancelled) {
          setNotes(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async ({ title, content }) => {
    try {
      await api.createNote({ title, content });
      const data = await api.fetchNotes();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async ({ title, content }) => {
    try {
      setConflict(null);
      await api.updateNote(editingNote.id, {
        title,
        content,
        version: editingNote.version,
      });
      setEditingNote(null);
      const data = await api.fetchNotes();
      setNotes(data);
    } catch (err) {
      if (err.status === 409) {
        setConflict({
          noteId: err.noteId,
          clientVersion: err.clientVersion,
          currentVersion: err.currentVersion,
          message: err.message,
        });
        const data = await api.fetchNotes();
        setNotes(data);
        const latest = data.find((n) => n.id === err.noteId);
        if (latest) {
          setEditingNote(latest);
        }
      } else {
        setError(err.message);
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteNote(id);
      const data = await api.fetchNotes();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const dismissConflict = () => {
    setConflict(null);
    setEditingNote(null);
  };

  return (
    <div className="app">
      <h1>Notes</h1>
      {error && <div className="error">{error}</div>}
      {conflict && (
        <div className="conflict-banner">
          <p>{conflict.message}</p>
          <p>
            Your version (v{conflict.clientVersion}) was stale. Current version
            is v{conflict.currentVersion}.
          </p>
          <button onClick={dismissConflict}>Dismiss</button>
        </div>
      )}
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
