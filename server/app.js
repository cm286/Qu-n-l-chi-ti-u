const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const expenseRoute = require('./routes/expenseRoutes');
const authRoute = require('./routes/authRoute');
const adminRoute = require('./routes/adminRoute');

const app = express();

app.use(express.json());

const allowedOrigins = [
  process.env.CLIENT_URL || 'https://qu-n-l-chi-ti-u-tau.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://qu-n-l-chi-ti-u.onrender.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use('/api/v2/expense', expenseRoute);
app.use('/api/v2/auth', authRoute);
app.use('/api/v2/admin', adminRoute);

module.exports = app;