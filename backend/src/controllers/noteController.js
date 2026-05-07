const noteService = require('../services/noteService');

class NoteController {
  async create(req, res) {
    try {
      const { title, content } = req.body;
      const note = await noteService.create({ title, content });
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async findAll(req, res) {
    try {
      const notes = await noteService.findAll();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async findById(req, res) {
    try {
      const note = await noteService.findById(req.params.id);
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
      const { title, content } = req.body;
      const note = await noteService.update(req.params.id, { title, content });
      res.json(note);
    } catch (error) {
      if (error.message === 'Note not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await noteService.delete(req.params.id);
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
