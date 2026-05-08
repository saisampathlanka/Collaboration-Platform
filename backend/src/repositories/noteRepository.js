const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');

class NoteRepository {
  async create({ title, content, userId }) {
    const id = uuidv4();
    const { rows } = await pool.query(
      'INSERT INTO notes (id, user_id, title, content, version) VALUES ($1, $2, $3, $4, 1) RETURNING *',
      [id, userId, title, content]
    );
    return rows[0];
  }

  async findAllByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findByIdAndUserId(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0] || null;
  }

  async updateWithVersion(id, { title, content }, expectedVersion) {
    const { rows } = await pool.query(
      `UPDATE notes
       SET title = $1, content = $2, version = version + 1, updated_at = clock_timestamp()
       WHERE id = $3 AND version = $4
       RETURNING *`,
      [title, content, id, expectedVersion]
    );
    return rows[0] || null;
  }

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    return rowCount > 0;
  }

  async deleteByIdAndUserId(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  }
}

module.exports = new NoteRepository();
