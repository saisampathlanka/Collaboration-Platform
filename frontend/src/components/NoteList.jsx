import NoteItem from './NoteItem';

function NoteList({ notes, onView, onEdit, onDelete }) {
  if (notes.length === 0) {
    return <p className="empty-message">No notes yet. Create one above!</p>;
  }

  return (
    <div className="note-list">
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default NoteList;
