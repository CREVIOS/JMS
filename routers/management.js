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
  	console.log('Time: ', Date());
  	console.log('IP: ', req.headers['x-forwarded-for'] || req.connection.remoteAddress);
	next();
});

router.get('/articles', function (req, res) {
  	if (isAuthenticated(req)) {
		firebase.getAllArticles(req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.get('/article_overview', function (req, res) {
  	if (isAuthenticated(req)) {
		firebase.articleOverview(req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}

});

router.get('/dept_info', function (req, res) {
  	if (isAuthenticated(req)) {
		firebase.getDepartmentInfo(req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.get(['/', '/index'], function (req, res) {
  	if (isAuthenticated(req)) {
		firebase.getOverview(req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.get('/members', function (req, res) {
  	if (isAuthenticated(req)) {
		firebase.getAllUsers(req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.get('/final_reviews', function (req, res) {
  	if (isAuthenticated(req)) {
		firebase.getFinalReviews(req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.get('/login', function (req, res) {
    res.render(path.join(__dirname+'/../views/login.ejs'));

});

router.post('/login', (req, res) => {
	firebase.login(req.body.email, req.body.password, req, res);
});

router.get('/logout', (req, res) => {
	req.session.authenticatedUser = undefined;
	res.render(path.join(__dirname+'/../views/login.ejs'));
});

router.post('/saveArticle', (req, res) => {
  	if (isAuthenticated(req)) {
		firebase.saveArticle(req.body, req.query.id, req.query.dept, req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.post('/assignEditor', (req, res) => {
  	if (isAuthenticated(req)) {
		firebase.assignEditor(req.body, req.query.id, req.query.dept, req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.post('/resetPassword', (req, res) => {
	firebase.resetPassword(req.body.email, req, res);
});

router.get('/resetPassword', (req, res) => {
	req.session.authenticatedUser = undefined;
	res.render(path.join(__dirname+'/../views/resetPassword.ejs'));
});

module.exports = router