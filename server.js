const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const { sequelize } = require('./models'); // Only sequelize here

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/form', require('./routes/form'));
app.use('/api/n8n', require('./routes/n8n'));


// Sync DB
sequelize.sync().then(() => {
  app.listen(3001, () => console.log('Backend running on port 3001'));
});

app.get('/', (req, res) => {
  res.send('Recruitment backend is running ✅');
});
