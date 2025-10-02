const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api', userRoutes);
app.listen(8000, () => console.log('Server started on http://localhost:8000'));
