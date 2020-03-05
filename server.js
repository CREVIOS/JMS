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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 1000*60*60*24*2 + Date.now()
}))

app.use('/', webplatform);
app.use('/submit', submissions);

let listener = app.listen(process.env.PORT || 8080);
console.log('Listening on port ' + listener.address().port);
