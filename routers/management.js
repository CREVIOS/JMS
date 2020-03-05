const path = require('path');
const fs = require('fs');
const express = require('express')
const router = express.Router()
const firebase = require('./../api/firebase.js');

function isAuthenticated(req) {
	if (req.session.authenticatedUser) {
		return true;
	} else {
		return false;
	}
};

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now());
  console.log('IP: ', req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  	if (isAuthenticated(req)) {
		next();
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
})

router.get('/articles', function (req, res) {
	firebase.getAllArticles(req, res);
})

router.get('/article_overview', function (req, res) {
	firebase.articleOverview(req, res);
})

router.get('/dept_info', function (req, res) {
	firebase.getDepartmentInfo(req, res);
})

router.get(['/', '/index'], function (req, res) {
	firebase.getOverview(req, res);
})

router.get('/members', function (req, res) {
	firebase.getAllUsers(req, res);
})

router.get('/login', function (req, res) {
    res.render(path.join(__dirname+'/../views/login.ejs'));
})

router.post('/login', (req, res) => {
	firebase.login(req.body.email, req.body.password, req, res);
});

router.get('/logout', (req, res) => {
    req.session.authenticatedUser = undefined;
	res.render(path.join(__dirname+'/../views/login.ejs'));
});

router.post('/saveArticle', (req, res) => {
	firebase.saveArticle(req.body, req.query.id, req.query.dept, req, res);
});

router.post('/assignEditor', (req, res) => {
	firebase.assignEditor(req.body, req.query.id, req.query.dept, req, res);
});


module.exports = router