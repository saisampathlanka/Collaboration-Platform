import { render, screen } from '@testing-library/react';
import NoteItem from '../components/NoteItem';

describe('NoteItem', () => {
  const mockNote = {
    id: 'test-id',
    title: 'Test Note',
    content: 'Test content',
    updated_at: '2024-01-01T12:00:00.000Z',
  };

  it('renders note title and content', () => {
    render(<NoteItem note={mockNote} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders edit and delete buttons', () => {
    render(<NoteItem note={mockNote} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onEdit with note when edit button clicked', () => {
    const handleEdit = vi.fn();
    render(<NoteItem note={mockNote} onEdit={handleEdit} onDelete={vi.fn()} />);

    screen.getByRole('button', { name: /edit/i }).click();

    expect(handleEdit).toHaveBeenCalledWith(mockNote);
  });

  it('calls onDelete with note id when delete button clicked', () => {
    const handleDelete = vi.fn();
    render(<NoteItem note={mockNote} onEdit={vi.fn()} onDelete={handleDelete} />);

    screen.getByRole('button', { name: /delete/i }).click();

    expect(handleDelete).toHaveBeenCalledWith('test-id');
  });

  it('renders formatted date', () => {
    render(<NoteItem note={mockNote} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const dateEl = screen.getByText(/1\/1\/2024/);
    expect(dateEl).toBeInTheDocument();
    expect(dateEl.className).toBe('note-date');
  });
});
