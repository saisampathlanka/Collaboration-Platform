const { NoteService, ConflictError } = require('../services/noteService');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class NoteController {
  async create(req, res) {
    try {
      const { title, content } = req.body;
      const note = await NoteService.create({ title, content, userId: req.user.userId });
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async findAll(req, res) {
    try {
      const notes = await NoteService.findAll(req.user.userId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async findById(req, res) {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid note ID format' });
      }
      const note = await NoteService.findById(req.params.id, req.user.userId);
      res.json(note);
    } catch (error) {
      if (error.message === 'Note not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid note ID format' });
      }
      const { title, content, version } = req.body;
      const note = await NoteService.update(req.params.id, { title, content, version }, req.user.userId);
      res.json(note);
    } catch (error) {
      if (error instanceof ConflictError) {
        return res.status(409).json({
          error: error.message,
          noteId: error.noteId,
          clientVersion: error.clientVersion,
          currentVersion: error.currentVersion,
        });
      }
      if (error.message === 'Note not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid note ID format' });
      }
      await NoteService.delete(req.params.id, req.user.userId);
      res.status(204).send();
    } catch (error) {
      if (error.message === 'Note not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new NoteController();
