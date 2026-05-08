const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');
const { createUserAndGetToken } = require('../helpers');

describe('Auth API — Integration', () => {
  describe('POST /auth/signup', () => {
    it('creates a new user and returns token', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'new@example.com', password: 'password123' })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.email).toBe('new@example.com');
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
    });

    it('rejects duplicate email with 409', async () => {
      await createUserAndGetToken('dupe@example.com', 'password123');

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'dupe@example.com', password: 'password123' })
        .expect(409);

      expect(res.body.error).toBe('Email already registered');
    });

    it('rejects missing email', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ password: 'password123' })
        .expect(400);

      expect(res.body.error).toBe('Email and password are required');
    });

    it('rejects missing password', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(res.body.error).toBe('Email and password are required');
    });

    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);

      expect(res.body.error).toBe('Invalid email format');
    });

    it('rejects short password', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: '12345' })
        .expect(400);

      expect(res.body.error).toBe('Password must be at least 6 characters');
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials and returns token', async () => {
      await createUserAndGetToken('login-test@example.com', 'mypassword');

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'login-test@example.com', password: 'mypassword' })
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user.email).toBe('login-test@example.com');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('rejects invalid password', async () => {
      await createUserAndGetToken('wrong-pw@example.com', 'correctpw');

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'wrong-pw@example.com', password: 'wrongpw' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
    });

    it('rejects non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'doesnotexist@example.com', password: 'password123' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
    });
  });

  describe('GET /auth/me', () => {
    it('returns authenticated user', async () => {
      const { token } = await createUserAndGetToken('me-test@example.com', 'password123');

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe('me-test@example.com');
      expect(res.body.id).toBeDefined();
      expect(res.body.password_hash).toBeUndefined();
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(res.body.error).toBe('Authentication required');
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(res.body.error).toBe('Invalid token');
    });

    it('returns 401 with malformed authorization header', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'BadFormat token')
        .expect(401);

      expect(res.body.error).toBe('Invalid authorization header format');
    });

    it('returns 401 with empty authorization header', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', '')
        .expect(401);

      expect(res.body.error).toBe('Authentication required');
    });
  });

  describe('Password Security', () => {
    it('stores passwords as hashes, not plaintext', async () => {
      const { email, password } = await createUserAndGetToken('hash-test@example.com', 'securepassword');

      const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email]);
      const hash = rows[0].password_hash;

      expect(hash).not.toBe('securepassword');
      const isValid = await bcrypt.compare('securepassword', hash);
      expect(isValid).toBe(true);
    });

    it('does not return password_hash in any response', async () => {
      const signupRes = await request(app)
        .post('/auth/signup')
        .send({ email: 'nohash@example.com', password: 'password123' })
        .expect(201);

      expect(signupRes.body.user.password_hash).toBeUndefined();

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'nohash@example.com', password: 'password123' })
        .expect(200);

      expect(loginRes.body.user.password_hash).toBeUndefined();

      const meRes = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .expect(200);

      expect(meRes.body.password_hash).toBeUndefined();
    });
  });
});
