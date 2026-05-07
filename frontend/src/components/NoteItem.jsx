function NoteItem({ note, onEdit, onDelete }) {
  return (
    <div className="note-item">
      <div className="note-content">
        <h3>{note.title}</h3>
        <p>{note.content}</p>
        <span className="note-date">
          {new Date(note.updated_at).toLocaleString()}
        </span>
      </div>
      <div className="note-actions">
        <button onClick={() => onEdit(note)}>Edit</button>
        <button onClick={() => onDelete(note.id)} className="delete-btn">
          Delete
        </button>
      </div>
    </div>
  );
}

export default NoteItem;
