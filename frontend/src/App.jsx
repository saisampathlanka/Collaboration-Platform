import { useState, useEffect } from "react";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import * as api from "./services/api";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [draft, setDraft] = useState(null);
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
    if (!editingNote) return;

    try {
      setConflict(null);
      await api.updateNote(editingNote.id, {
        title,
        content,
        version: editingNote.version,
      });
      setEditingNote(null);
      setDraft(null);
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

  const startEdit = (note) => {
    setEditingNote(note);
    setDraft({ title: note.title, content: note.content });
    setConflict(null);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setDraft(null);
    setConflict(null);
  };

  const retryWithLatest = async () => {
    if (!draft) return;
    const latest = notes.find((n) => n.id === conflict.noteId);
    if (!latest) return;

    try {
      await api.updateNote(latest.id, {
        title: draft.title,
        content: draft.content,
        version: latest.version,
      });
      setEditingNote(null);
      setDraft(null);
      setConflict(null);
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
      } else {
        setError(err.message);
      }
    }
  };

  const reloadAndDiscard = () => {
    const latest = notes.find((n) => n.id === conflict.noteId);
    if (latest) {
      setEditingNote(latest);
      setDraft({ title: latest.title, content: latest.content });
    }
    setConflict(null);
  };

  const dismissConflict = () => {
    setConflict(null);
    setEditingNote(null);
    setDraft(null);
  };

  return (
    <div className="app">
      <h1>Notes</h1>
      {error && <div className="error">{error}</div>}
      {conflict && (
        <div className="conflict-banner">
          <p className="conflict-message">{conflict.message}</p>
          <p className="conflict-detail">
            Your version (v{conflict.clientVersion}) was stale. Current version
            is v{conflict.currentVersion}.
          </p>
          <div className="conflict-actions">
            <button onClick={retryWithLatest} className="retry-btn">
              Retry (keep your changes)
            </button>
            <button onClick={reloadAndDiscard} className="reload-btn">
              Reload latest (discard your changes)
            </button>
            <button onClick={dismissConflict} className="dismiss-btn">
              Cancel
            </button>
          </div>
        </div>
      )}
      <NoteForm
        note={draft ? { ...editingNote, title: draft.title, content: draft.content } : editingNote}
        onFieldChange={draft ? setDraft : null}
        onSubmit={editingNote ? handleUpdate : handleCreate}
        onCancel={cancelEdit}
      />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <NoteList
          notes={notes}
          onEdit={startEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default App;
