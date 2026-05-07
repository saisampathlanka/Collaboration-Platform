const noteRepository = require('../repositories/noteRepository');

class NoteService {
  async create({ title, content }) {
    if (!title && !content) {
      throw new Error('Title or content is required');
    }
    return await noteRepository.create({
      title: title || 'Untitled',
      content: content || '',
    });
  }

  async findAll() {
    return await noteRepository.findAll();
  }

  async findById(id) {
    const note = await noteRepository.findById(id);
    if (!note) {
      throw new Error('Note not found');
    }
    return note;
  }

  async update(id, { title, content }) {
    const existing = await noteRepository.findById(id);
    if (!existing) {
      throw new Error('Note not found');
    }
    return await noteRepository.update(id, {
      title: title !== undefined ? title : existing.title,
      content: content !== undefined ? content : existing.content,
    });
  }

  async delete(id) {
    const existing = await noteRepository.findById(id);
    if (!existing) {
      throw new Error('Note not found');
    }
    return await noteRepository.delete(id);
  }
}

module.exports = new NoteService();
