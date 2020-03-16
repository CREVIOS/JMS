const path = require('path');
const createError = require('http-errors');
const fs = require('fs');
const express = require('express')
const router = express.Router()
const firebase = require('./../api/firebase.js');
const ams = require('./../api/ams.js');
const em = require('./../api/errorMessages.js');

function isAuthenticated(req) {
	if (req.session.authenticatedUser && req.session.authenticatedUserLevel) {
		return true;
	} else {
		req.session.authenticatedUser = undefined;
		req.session.authenticatedUserLevel = undefined;
		return false;
	}
};

function authorizedAccess(url, userLevel) {
	let minAccess = parseInt(ams.minimumAccess(url));
	if (userLevel >= minAccess) {
		return true;
	} else if (minAccess == 0) {
		return true;
	}
	return false;
};

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  	console.log('Time: ', Date());
  	console.log('IP: ', req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  	let reqPath = (req.baseUrl + req.path).replace(/\/$/, "");
	if (authorizedAccess(reqPath, req.session.authenticatedUserLevel)) {
		next();
	} else {
    	res.render(path.join(__dirname+'/../views/error.ejs'), {error: createError(401, em.errorMessage(401))});
	}
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
	req.session.authenticatedUserLevel = undefined;
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