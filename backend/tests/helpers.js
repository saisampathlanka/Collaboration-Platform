const request = require('supertest');
const app = require('../src/app');

const createUserAndGetToken = async (email = 'test@example.com', password = 'password123') => {
  const res = await request(app)
    .post('/auth/signup')
    .send({ email, password })
    .expect(201);

  return { token: res.body.token, user: res.body.user, email, password };
};

module.exports = { createUserAndGetToken };
