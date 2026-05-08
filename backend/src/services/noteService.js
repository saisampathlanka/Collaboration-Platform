const noteRepository = require('../repositories/noteRepository');

class ConflictError extends Error {
  constructor(noteId, clientVersion, currentVersion) {
    super('Note has been modified by another client');
    this.name = 'ConflictError';
    this.noteId = noteId;
    this.clientVersion = clientVersion;
    this.currentVersion = currentVersion;
  }
}

class NoteService {
  async create({ title, content, userId }) {
    if (!title && !content) {
      throw new Error('Title or content is required');
    }
    return await noteRepository.create({
      title: title || 'Untitled',
      content: content || '',
      userId,
    });
  }

  async findAll(userId) {
    return await noteRepository.findAllByUserId(userId);
  }

  async findById(id, userId) {
    const note = await noteRepository.findByIdAndUserId(id, userId);
    if (!note) {
      throw new Error('Note not found');
    }
    return note;
  }

  async update(id, { title, content, version }, userId) {
    if (version === undefined || version === null) {
      throw new Error('Version is required for updates');
    }

    if (typeof version !== 'number' || version < 1 || !Number.isInteger(version)) {
      throw new Error('Invalid version number');
    }

    const existing = await noteRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new Error('Note not found');
    }

    const updated = await noteRepository.updateWithVersion(
      id,
      {
        title: title !== undefined ? title : existing.title,
        content: content !== undefined ? content : existing.content,
      },
      version
    );

    if (!updated) {
      const current = await noteRepository.findByIdAndUserId(id, userId);
      console.log(
        `OCC CONFLICT: note_id=${id} client_version=${version} current_version=${current?.version}`
      );
      throw new ConflictError(id, version, current?.version);
    }

    console.log(
      `OCC UPDATE: note_id=${id} version ${version} -> ${updated.version}`
    );
    return updated;
  }

  async delete(id, userId) {
    const existing = await noteRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new Error('Note not found');
    }
    return await noteRepository.deleteByIdAndUserId(id, userId);
  }
}

module.exports = { NoteService: new NoteService(), ConflictError };
