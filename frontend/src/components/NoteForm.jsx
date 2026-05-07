import { useState, useEffect } from 'react';

function NoteForm({ note, onFieldChange, onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    if (onFieldChange) {
      onFieldChange((prev) => ({ ...prev, title: value }));
    }
  };

  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    if (onFieldChange) {
      onFieldChange((prev) => ({ ...prev, content: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, content });
    if (!note && !onFieldChange) {
      setTitle('');
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={handleTitleChange}
        required
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={handleContentChange}
        rows={5}
      />
      <div className="form-actions">
        <button type="submit">{note ? 'Update' : 'Create'}</button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default NoteForm;
