const authService = require('../services/authService');

class AuthController {
  async signup(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.signup({ email, password });
      res.status(201).json(result);
    } catch (error) {
      if (error.message === 'Email already registered') {
        return res.status(409).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async me(req, res) {
    try {
      const user = await authService.me(req.user.userId);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
