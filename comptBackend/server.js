require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app = express();

app.use(cors());

app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/companies', require('./routes/companies'));
app.use('/accounting', require('./routes/accounting'));
app.use('/super-admin', require('./routes/superAdmin'));
app.use('/profile',    require('./routes/profile'));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});