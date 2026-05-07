const noteService = require('../../src/services/noteService');
const noteRepository = require('../../src/repositories/noteRepository');

jest.mock('../../src/repositories/noteRepository');

describe('NoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a note with title and content', async () => {
      const input = { title: 'Test', content: 'Body' };
      noteRepository.create.mockResolvedValue({
        id: 'mock-uuid',
        ...input,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await noteService.create(input);

      expect(noteRepository.create).toHaveBeenCalledWith(input);
      expect(result.title).toBe('Test');
      expect(result.id).toBe('mock-uuid');
    });

    it('defaults title to Untitled when missing', async () => {
      noteRepository.create.mockResolvedValue({
        id: 'mock-uuid',
        title: 'Untitled',
        content: 'Body',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await noteService.create({ content: 'Body' });

      expect(noteRepository.create).toHaveBeenCalledWith({
        title: 'Untitled',
        content: 'Body',
      });
    });

    it('defaults content to empty string when missing', async () => {
      noteRepository.create.mockResolvedValue({
        id: 'mock-uuid',
        title: 'Test',
        content: '',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await noteService.create({ title: 'Test' });

      expect(noteRepository.create).toHaveBeenCalledWith({
        title: 'Test',
        content: '',
      });
    });

    it('throws when both title and content are missing', async () => {
      await expect(noteService.create({})).rejects.toThrow(
        'Title or content is required'
      );
      expect(noteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all notes', async () => {
      const mockNotes = [
        { id: '1', title: 'A', content: '', created_at: new Date(), updated_at: new Date() },
        { id: '2', title: 'B', content: '', created_at: new Date(), updated_at: new Date() },
      ];
      noteRepository.findAll.mockResolvedValue(mockNotes);

      const result = await noteService.findAll();

      expect(result).toHaveLength(2);
      expect(noteRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no notes exist', async () => {
      noteRepository.findAll.mockResolvedValue([]);

      const result = await noteService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns a note when it exists', async () => {
      const mockNote = {
        id: 'mock-id',
        title: 'Test',
        content: 'Body',
        created_at: new Date(),
        updated_at: new Date(),
      };
      noteRepository.findById.mockResolvedValue(mockNote);

      const result = await noteService.findById('mock-id');

      expect(result.id).toBe('mock-id');
    });

    it('throws when note does not exist', async () => {
      noteRepository.findById.mockResolvedValue(null);

      await expect(noteService.findById('nonexistent-id')).rejects.toThrow(
        'Note not found'
      );
    });
  });

  describe('update', () => {
    it('updates title and preserves content when only title provided', async () => {
      const existing = {
        id: 'mock-id',
        title: 'Old',
        content: 'Body',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const updated = {
        id: 'mock-id',
        title: 'New',
        content: 'Body',
        created_at: new Date(),
        updated_at: new Date(),
      };
      noteRepository.findById.mockResolvedValue(existing);
      noteRepository.update.mockResolvedValue(updated);

      const result = await noteService.update('mock-id', { title: 'New' });

      expect(noteRepository.update).toHaveBeenCalledWith('mock-id', {
        title: 'New',
        content: 'Body',
      });
      expect(result.title).toBe('New');
    });

    it('throws when updating a non-existent note', async () => {
      noteRepository.findById.mockResolvedValue(null);

      await expect(
        noteService.update('nonexistent-id', { title: 'New' })
      ).rejects.toThrow('Note not found');
    });
  });

  describe('delete', () => {
    it('deletes an existing note', async () => {
      const existing = {
        id: 'mock-id',
        title: 'Test',
        content: 'Body',
        created_at: new Date(),
        updated_at: new Date(),
      };
      noteRepository.findById.mockResolvedValue(existing);
      noteRepository.delete.mockResolvedValue(true);

      const result = await noteService.delete('mock-id');

      expect(result).toBe(true);
    });

    it('throws when deleting a non-existent note', async () => {
      noteRepository.findById.mockResolvedValue(null);

      await expect(noteService.delete('nonexistent-id')).rejects.toThrow(
        'Note not found'
      );
    });
  });
});
