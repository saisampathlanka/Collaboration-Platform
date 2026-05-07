const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');

class NoteRepository {
  async create({ title, content }) {
    const id = uuidv4();
    const { rows } = await pool.query(
      'INSERT INTO notes (id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [id, title, content]
    );
    return rows[0];
  }

  async findAll() {
    const { rows } = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async update(id, { title, content }) {
    const { rows } = await pool.query(
      'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = new NoteRepository();
