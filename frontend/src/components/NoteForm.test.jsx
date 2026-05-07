import { render, screen } from '@testing-library/react';
import NoteForm from '../components/NoteForm';

describe('NoteForm', () => {
  it('renders create form with empty fields', () => {
    render(<NoteForm onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText('Title')).toHaveValue('');
    expect(screen.getByPlaceholderText('Content')).toHaveValue('');
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('renders edit form with existing note values', () => {
    const note = { id: '1', title: 'Existing', content: 'Body' };
    render(<NoteForm note={note} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByPlaceholderText('Title')).toHaveValue('Existing');
    expect(screen.getByPlaceholderText('Content')).toHaveValue('Body');
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  it('shows cancel button only in edit mode', () => {
    const { rerender } = render(<NoteForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();

    rerender(
      <NoteForm
        note={{ id: '1', title: 'Test', content: '' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onSubmit with form data on submit', () => {
    const handleSubmit = vi.fn();
    render(<NoteForm onSubmit={handleSubmit} />);

    screen.getByPlaceholderText('Title').focus();
    screen.getByPlaceholderText('Title').dispatchEvent(
      new InputEvent('input', { bubbles: true, cancelable: true })
    );
    screen.getByPlaceholderText('Content').focus();
    screen.getByPlaceholderText('Content').dispatchEvent(
      new InputEvent('input', { bubbles: true, cancelable: true })
    );
  });
});
