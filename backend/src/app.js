require('dotenv').config();
const express = require('express');
const cors = require('cors');
const noteRoutes = require('./routes/noteRoutes');
const authRoutes = require('./routes/authRoutes');
const requestLogger = require('./middleware/requestLogger');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

app.get('/', (req, res) => {
  res.json('welcome to collab platform');
});

app.use('/auth', authRoutes);
app.use('/notes', noteRoutes);

module.exports = app;
