import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import NoteForm from "./components/NoteForm";
import NoteList from "./components/NoteList";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import * as api from "./services/api";
import "./App.css";

function App() {
  const { user, loading, logout } = useAuth();
  const [authPage, setAuthPage] = useState("login");
  const [notes, setNotes] = useState([]);
  const [viewingNote, setViewingNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notesLoading, setNotesLoading] = useState(true);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (!user) return;

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
        if (!cancelled) setNotesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return <div className="app"><p>Loading...</p></div>;
  }

  if (!user) {
    return (
      <div className="app">
        {authPage === "login" ? (
          <LoginPage onSwitch={() => setAuthPage("signup")} />
        ) : (
          <SignupPage onSwitch={() => setAuthPage("login")} />
        )}
      </div>
    );
  }

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
      setError(null);
      const updated = await api.updateNote(editingNote.id, {
        title,
        content,
        version: editingNote.version,
      });
      setEditingNote(updated);
      setDraft(null);
      const data = await api.fetchNotes();
      setNotes(data);
      setSuccess('Note saved!');
      setTimeout(() => setSuccess(null), 2000);
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
      if (editingNote && editingNote.id === id) {
        setEditingNote(null);
        setDraft(null);
        setConflict(null);
        setSuccess(null);
      }
      if (viewingNote && viewingNote.id === id) {
        setViewingNote(null);
      }
      const data = await api.fetchNotes();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const startView = (note) => {
    setViewingNote(note);
    setEditingNote(null);
    setDraft(null);
    setConflict(null);
    setSuccess(null);
  };

  const startEdit = (note) => {
    setViewingNote(null);
    setEditingNote(note);
    setDraft({ title: note.title, content: note.content });
    setConflict(null);
    setSuccess(null);
  };

  const startEditFromView = () => {
    if (!viewingNote) return;
    startEdit(viewingNote);
  };

  const closeView = () => {
    setViewingNote(null);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setDraft(null);
    setConflict(null);
    setSuccess(null);
  };

  const retryWithLatest = async () => {
    if (!draft) return;
    const latest = notes.find((n) => n.id === conflict.noteId);
    if (!latest) return;

    try {
      const updated = await api.updateNote(latest.id, {
        title: draft.title,
        content: draft.content,
        version: latest.version,
      });
      setEditingNote(updated);
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

  const hasChanges = editingNote && draft && (draft.title !== editingNote.title || draft.content !== editingNote.content);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Notes</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
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
      {viewingNote && !editingNote ? (
        <NoteForm
          note={viewingNote}
          readOnly={true}
          onSubmit={startEditFromView}
          onCancel={closeView}
        />
      ) : (
        <NoteForm
          note={draft ? { ...editingNote, title: draft.title, content: draft.content } : editingNote}
          onFieldChange={editingNote ? setDraft : null}
          onSubmit={editingNote ? handleUpdate : handleCreate}
          onCancel={editingNote ? cancelEdit : null}
          hasChanges={hasChanges}
        />
      )}
      {notesLoading ? (
        <p>Loading...</p>
      ) : (
        <NoteList
          notes={notes}
          onView={startView}
          onEdit={startEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default App;
