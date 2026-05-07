const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

router.post('/', (req, res) => noteController.create(req, res));
router.get('/', (req, res) => noteController.findAll(req, res));
router.get('/:id', (req, res) => noteController.findById(req, res));
router.put('/:id', (req, res) => noteController.update(req, res));
router.delete('/:id', (req, res) => noteController.delete(req, res));

module.exports = router;
