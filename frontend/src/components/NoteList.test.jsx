import { render, screen } from '@testing-library/react';
import NoteList from '../components/NoteList';

describe('NoteList', () => {
  const mockNotes = [
    { id: '1', title: 'First', content: 'Content 1', updated_at: '2024-01-01T12:00:00.000Z' },
    { id: '2', title: 'Second', content: 'Content 2', updated_at: '2024-01-02T12:00:00.000Z' },
  ];

  it('renders all notes', () => {
    render(<NoteList notes={mockNotes} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('shows empty message when no notes', () => {
    render(<NoteList notes={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('No notes yet. Create one above!')).toBeInTheDocument();
  });

  it('passes onEdit and onDelete to NoteItem', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    render(<NoteList notes={mockNotes} onEdit={handleEdit} onDelete={handleDelete} />);

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });
});
