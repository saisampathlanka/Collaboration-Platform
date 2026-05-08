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
    // clock_timestamp() gives actual wall clock time (not transaction start time)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp()
      )
    `);

    // Migration: add user_id to existing notes tables that were created before Phase 2
    await client.query(`
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
        content TEXT NOT NULL DEFAULT '',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
        content TEXT NOT NULL DEFAULT '',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp()
      )
    `);

    await client.query(`
      ALTER TABLE notes ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1
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
