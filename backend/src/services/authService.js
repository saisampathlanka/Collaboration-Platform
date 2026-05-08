const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'collab-dev-secret-change-in-production';
const SALT_ROUNDS = 10;

class AuthService {
  async signup({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Invalid email format');
    }

    if (typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      console.log(`SIGNUP FAILED: email=${email} reason=duplicate`);
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = uuidv4();

    const user = await userRepository.create({ id, email, passwordHash });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    console.log(`SIGNUP SUCCESS: user_id=${user.id} email=${email}`);
    return { user, token };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      console.log(`LOGIN FAILED: email=${email} reason=not_found`);
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.log(`LOGIN FAILED: email=${email} reason=invalid_password`);
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    console.log(`LOGIN SUCCESS: user_id=${user.id} email=${email}`);
    return { user: { id: user.id, email: user.email, created_at: user.created_at, updated_at: user.updated_at }, token };
  }

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = new AuthService();
