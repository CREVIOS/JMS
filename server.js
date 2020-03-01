//import packages 
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session')
const crypto = require('crypto');
const app = express();

// Load router files
var webplatform = require('./routers/management.js');
var submissions = require('./routers/submission.js');

console.log('Running server')

app.engine('view engine', require('ejs').renderFile);
app.use(express.static('public'));
app.use('/', webplatform);
app.use('/submit', submissions);

app.listen(process.env.PORT || 8080);