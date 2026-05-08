const { NoteService, ConflictError } = require('../../src/services/noteService');
const noteRepository = require('../../src/repositories/noteRepository');

jest.mock('../../src/repositories/noteRepository');

describe('NoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const testUserId = 'test-user-id';

    it('creates a note with title and content', async () => {
      const input = { title: 'Test', content: 'Body' };
      noteRepository.create.mockResolvedValue({
        id: 'mock-uuid',
        ...input,
        user_id: testUserId,
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const result = await NoteService.create({ ...input, userId: testUserId });

      expect(noteRepository.create).toHaveBeenCalledWith({ ...input, userId: testUserId });
      expect(result.title).toBe('Test');
      expect(result.id).toBe('mock-uuid');
    });

    it('defaults title to Untitled when missing', async () => {
      noteRepository.create.mockResolvedValue({
        id: 'mock-uuid',
        title: 'Untitled',
        content: 'Body',
        user_id: testUserId,
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await NoteService.create({ content: 'Body', userId: testUserId });

      expect(noteRepository.create).toHaveBeenCalledWith({
        title: 'Untitled',
        content: 'Body',
        userId: testUserId,
      });
    });

    it('defaults content to empty string when missing', async () => {
      noteRepository.create.mockResolvedValue({
        id: 'mock-uuid',
        title: 'Test',
        content: '',
        user_id: testUserId,
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await NoteService.create({ title: 'Test', userId: testUserId });

      expect(noteRepository.create).toHaveBeenCalledWith({
        title: 'Test',
        content: '',
        userId: testUserId,
      });
    });

    it('throws when both title and content are missing', async () => {
      await expect(NoteService.create({ userId: testUserId })).rejects.toThrow(
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
      noteRepository.findAllByUserId.mockResolvedValue(mockNotes);

      const result = await NoteService.findAll('user-id');

      expect(result).toHaveLength(2);
      expect(noteRepository.findAllByUserId).toHaveBeenCalledWith('user-id');
    });

    it('returns empty array when no notes exist', async () => {
      noteRepository.findAllByUserId.mockResolvedValue([]);

      const result = await NoteService.findAll('user-id');

      expect(result).toEqual([]);
      expect(noteRepository.findAllByUserId).toHaveBeenCalledWith('user-id');
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
      noteRepository.findByIdAndUserId.mockResolvedValue(mockNote);

      const result = await NoteService.findById('mock-id', 'user-id');

      expect(result.id).toBe('mock-id');
      expect(noteRepository.findByIdAndUserId).toHaveBeenCalledWith('mock-id', 'user-id');
    });

    it('throws when note does not exist', async () => {
      noteRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(NoteService.findById('nonexistent-id', 'user-id')).rejects.toThrow(
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
      noteRepository.findByIdAndUserId.mockResolvedValue(existing);
      noteRepository.updateWithVersion.mockResolvedValue(updated);

      const result = await NoteService.update('mock-id', { title: 'New', version: 1 }, 'user-id');

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
      noteRepository.findByIdAndUserId.mockResolvedValue(existing);
      noteRepository.updateWithVersion.mockResolvedValue(null);
      noteRepository.findByIdAndUserId.mockResolvedValueOnce(existing);
      noteRepository.findByIdAndUserId.mockResolvedValueOnce(current);

      await expect(
        NoteService.update('mock-id', { title: 'New', version: 3 }, 'user-id')
      ).rejects.toThrow(ConflictError);

      await expect(
        NoteService.update('mock-id', { title: 'New', version: 3 }, 'user-id')
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
      noteRepository.findByIdAndUserId.mockResolvedValue(existing);

      await expect(
        NoteService.update('mock-id', { title: 'New' }, 'user-id')
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
      noteRepository.findByIdAndUserId.mockResolvedValue(existing);

      await expect(
        NoteService.update('mock-id', { title: 'New', version: 'abc' }, 'user-id')
      ).rejects.toThrow('Invalid version number');
    });

    it('throws when updating a non-existent note', async () => {
      noteRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        NoteService.update('nonexistent-id', { title: 'New', version: 1 }, 'user-id')
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
      noteRepository.findByIdAndUserId.mockResolvedValue(existing);
      noteRepository.deleteByIdAndUserId.mockResolvedValue(true);

      const result = await NoteService.delete('mock-id', 'user-id');

      expect(result).toBe(true);
      expect(noteRepository.findByIdAndUserId).toHaveBeenCalledWith('mock-id', 'user-id');
      expect(noteRepository.deleteByIdAndUserId).toHaveBeenCalledWith('mock-id', 'user-id');
    });

    it('throws when deleting a non-existent note', async () => {
      noteRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(NoteService.delete('nonexistent-id', 'user-id')).rejects.toThrow(
        'Note not found'
      );
    });
  });
});
