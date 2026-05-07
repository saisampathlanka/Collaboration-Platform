require('dotenv').config();
const { Pool } = require('pg');

// Connection pool manages reusable DB connections instead of creating new ones per query
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'collabdb',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 10, // max concurrent connections in the pool
  idleTimeoutMillis: 30000, // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail if no connection acquired in 2s
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    // Create the notes table if it doesn't exist
    // id: UUID generated automatically by PostgreSQL on each insert
    // title/content: text fields with sensible defaults
    // created_at: records when the note was first created
    // updated_at: records when the note was created (trigger keeps this current on updates)
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
        content TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Define a reusable function that sets updated_at to the current timestamp
    // This function will be called by a trigger before every UPDATE on the notes table
    // NEW refers to the row about to be written; we overwrite its updated_at column
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Attach the function as a trigger on the notes table
    // DROP IF EXISTS ensures idempotency on repeated server starts
    // BEFORE UPDATE: fires before the row is written back
    // FOR EACH ROW: runs once per affected row (not once per statement)
    await client.query(`
      DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
      CREATE TRIGGER update_notes_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
};

// Wrap pool.query to log the execution time of every SQL statement
const originalQuery = pool.query;
pool.query = async (text, params) => {
  const start = Date.now();
  const result = await originalQuery.call(pool, text, params);
  const duration = Date.now() - start;
  console.log(`DB: ${text.substring(0, 60)}... - ${duration}ms`);
  return result;
};

module.exports = { pool, initDb };
