const express = require('express');
const cors = require('cors');
require('dotenv').config();

const inventoryRoutes = require('./routes/inventoryRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const batchRoutes = require('./routes/batchRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', inventoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/users', userRoutes);

module.exports = app;