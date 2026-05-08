const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, (req, res) => noteController.create(req, res));
router.get('/', authMiddleware, (req, res) => noteController.findAll(req, res));
router.get('/:id', authMiddleware, (req, res) => noteController.findById(req, res));
router.put('/:id', authMiddleware, (req, res) => noteController.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => noteController.delete(req, res));

module.exports = router;
