//import packages 
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session')
const crypto = require('crypto');
const app = express();

console.log('Running server')
app.engine('view engine', require('ejs').renderFile);
app.use(express.static('public'));

app.get('*',function(req,res){
    res.render(path.join(__dirname+'/views/index.ejs'));
});


app.listen(process.env.PORT || 8080);