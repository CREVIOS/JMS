const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session')
const crypto = require('crypto');

console.log('Running server')
app.engine('view engine', require('ejs').renderFile);
app.use(express.static('public'));

app.post('/login', (req, res) => {
    res.render(path.join(__dirname+'/views/index.ejs'), {submissions:names, requestedUser:submissions[0]});
});

app.get('*',function(req,res){
    res.render(path.join(__dirname+'/views/login.ejs'));
});


app.listen(process.env.PORT || 8080);