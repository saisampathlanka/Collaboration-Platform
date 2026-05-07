require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./src/config/db');
const noteRoutes = require('./src/routes/noteRoutes');
const requestLogger = require('./src/middleware/requestLogger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/', (req, res) => {
  res.json('welcome to collab platform');
});

app.use('/notes', noteRoutes);

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
