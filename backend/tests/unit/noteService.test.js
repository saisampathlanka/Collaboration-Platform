const { NoteService, ConflictError } = require('../../src/services/noteService');
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
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await NoteService.create(input);

      expect(noteRepository.create).toHaveBeenCalledWith(input);
      expect(result.title).toBe('Test');
      expect(result.id).toBe('mock-uuid');
    });

    it('defaults title to Untitled when missing', async () => {
      noteRepository.create.mockResolvedValue({
        id: 'mock-uuid',
        title: 'Untitled',
        content: 'Body',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await NoteService.create({ content: 'Body' });

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
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await NoteService.create({ title: 'Test' });

      expect(noteRepository.create).toHaveBeenCalledWith({
        title: 'Test',
        content: '',
      });
    });

    it('throws when both title and content are missing', async () => {
      await expect(NoteService.create({})).rejects.toThrow(
        'Title or content is required'
      );
      expect(noteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all notes', async () => {
      const mockNotes = [
        { id: '1', title: 'A', content: '', version: 1, created_at: new Date(), updated_at: new Date() },
        { id: '2', title: 'B', content: '', version: 1, created_at: new Date(), updated_at: new Date() },
      ];
      noteRepository.findAll.mockResolvedValue(mockNotes);

      const result = await NoteService.findAll();

      expect(result).toHaveLength(2);
      expect(noteRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no notes exist', async () => {
      noteRepository.findAll.mockResolvedValue([]);

      const result = await NoteService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns a note when it exists', async () => {
      const mockNote = {
        id: 'mock-id',
        title: 'Test',
        content: 'Body',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      noteRepository.findById.mockResolvedValue(mockNote);

      const result = await NoteService.findById('mock-id');

      expect(result.id).toBe('mock-id');
    });

    it('throws when note does not exist', async () => {
      noteRepository.findById.mockResolvedValue(null);

      await expect(NoteService.findById('nonexistent-id')).rejects.toThrow(
        'Note not found'
      );
    });
  });

  describe('update', () => {
    it('updates title and preserves content when version matches', async () => {
      const existing = {
        id: 'mock-id',
        title: 'Old',
        content: 'Body',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const updated = {
        id: 'mock-id',
        title: 'New',
        content: 'Body',
        version: 2,
        created_at: new Date(),
        updated_at: new Date(),
      };
      noteRepository.findById.mockResolvedValue(existing);
      noteRepository.updateWithVersion.mockResolvedValue(updated);

      const result = await NoteService.update('mock-id', { title: 'New', version: 1 });

      expect(noteRepository.updateWithVersion).toHaveBeenCalledWith('mock-id', {
        title: 'New',
        content: 'Body',
      }, 1);
      expect(result.title).toBe('New');
      expect(result.version).toBe(2);
    });

    it('throws ConflictError when version does not match', async () => {
      const existing = {
        id: 'mock-id',
        title: 'Current',
        content: 'Data',
        version: 5,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const current = { ...existing, version: 7 };
      noteRepository.findById.mockResolvedValue(existing);
      noteRepository.updateWithVersion.mockResolvedValue(null);
      noteRepository.findById.mockResolvedValueOnce(existing);
      noteRepository.findById.mockResolvedValueOnce(current);

      await expect(
        NoteService.update('mock-id', { title: 'New', version: 3 })
      ).rejects.toThrow(ConflictError);

      await expect(
        NoteService.update('mock-id', { title: 'New', version: 3 })
      ).rejects.toThrow('Note has been modified by another client');
    });

    it('throws when version is missing', async () => {
      const existing = {
        id: 'mock-id',
        title: 'Current',
        content: 'Data',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      noteRepository.findById.mockResolvedValue(existing);

      await expect(
        NoteService.update('mock-id', { title: 'New' })
      ).rejects.toThrow('Version is required for updates');
    });

    it('throws when version is invalid', async () => {
      const existing = {
        id: 'mock-id',
        title: 'Current',
        content: 'Data',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      noteRepository.findById.mockResolvedValue(existing);

      await expect(
        NoteService.update('mock-id', { title: 'New', version: 'abc' })
      ).rejects.toThrow('Invalid version number');
    });

    it('throws when updating a non-existent note', async () => {
      noteRepository.findById.mockResolvedValue(null);

      await expect(
        NoteService.update('nonexistent-id', { title: 'New', version: 1 })
      ).rejects.toThrow('Note not found');
    });
  });

  describe('delete', () => {
    it('deletes an existing note', async () => {
      const existing = {
        id: 'mock-id',
        title: 'Test',
        content: 'Body',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      noteRepository.findById.mockResolvedValue(existing);
      noteRepository.delete.mockResolvedValue(true);

      const result = await NoteService.delete('mock-id');

      expect(result).toBe(true);
    });

    it('throws when deleting a non-existent note', async () => {
      noteRepository.findById.mockResolvedValue(null);

      await expect(NoteService.delete('nonexistent-id')).rejects.toThrow(
        'Note not found'
      );
    });
  });
});
