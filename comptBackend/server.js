require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://comptappbj.netlify.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, cb) => {
    // Autoriser les requêtes sans origin (ex: Render health checks, curl)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS non autorisé : ' + origin));
  },
  credentials: true,
}));

app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/companies', require('./routes/companies'));
app.use('/accounting', require('./routes/accounting'));
app.use('/super-admin', require('./routes/superAdmin'));
app.use('/profile',    require('./routes/profile'));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});