const express = require('express');
const bodyParser = require('body-parser');
const database = require('./database');
const routes = require('./routes');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('frontend'));

app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  database.initialize(); // Initialize database if needed
});
