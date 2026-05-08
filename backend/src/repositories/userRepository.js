const { pool } = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await pool.query('SELECT id, email, created_at, updated_at FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async create({ id, email, passwordHash }) {
    const { rows } = await pool.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, created_at, updated_at',
      [id, email, passwordHash]
    );
    return rows[0];
  }
}

module.exports = new UserRepository();
