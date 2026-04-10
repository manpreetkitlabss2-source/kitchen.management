const express = require('express');
const cors = require('cors');
require('dotenv').config();

// You don't necessarily need to "connect" here anymore 
// because the pool handles it as soon as it's required in your routes.
const pool = require('./config/db');

const inventoryRoutes = require('./routes/inventoryRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const batchRoutes = require('./routes/batchRoutes');
const userRoutes = require('./routes/userRoutes');
const { setupDatabase } = require('./config/tables');

const app = express();

setupDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', inventoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/users', userRoutes);

// Start server

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));