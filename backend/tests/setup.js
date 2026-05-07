const { initDb, pool } = require('../src/config/db');

beforeAll(async () => {
  // Drop and recreate to ensure latest schema (clock_timestamp defaults)
  const client = await pool.connect();
  try {
    await client.query('DROP TABLE IF EXISTS notes CASCADE');
    await client.query(`
      CREATE TABLE notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
        content TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp()
      )
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = clock_timestamp();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    await client.query(`
      CREATE TRIGGER update_notes_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
  } finally {
    client.release();
  }
});

beforeEach(async () => {
  await pool.query('BEGIN');
});

afterEach(async () => {
  await pool.query('ROLLBACK');
});

afterAll(async () => {
  await pool.end();
});
