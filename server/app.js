const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const expenseRoute = require('./routes/expenseRoutes');
const authRoute = require('./routes/authRoute');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/v2/expense', expenseRoute);
app.use('/api/v2/auth', authRoute);

module.exports = app;
const cors = require("cors");

app.use(
    cors({
        origin: [
            "https://qu-n-l-chi-ti-u-tau.vercel.app"
        ],
        credentials: true,
    })
);