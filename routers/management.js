const path = require('path');
const createError = require('http-errors');
const fs = require('fs');
const express = require('express')
const router = express.Router()
const firebase = require('./../api/firebase.js');
const ams = require('./../api/ams.js');
const em = require('./../api/errorMessages.js');
const drive = require('./../api/googledrive.js');

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

router.get('/signup', function (req, res) {
	res.render(path.join(__dirname+'/../views/signup.ejs'));
});

router.post('/signup', (req, res) => {
	firebase.signupUser(req, res)
 });

router.get('/confirm_email/:hash', (req, res) => {
   var hash = request.params.hash; //hash from request
   var hashRef = baseDB.collection('Email-Verifications').doc(hash); //Get reference on UserID
   var getHash = hashRef.get()
  .then(doc => {
    if (!doc.exists) {
       console.log('No such document!');
    }
		else {
			//Get user from userID and update verification
			admin.auth().updateUser(doc.data()['userID'], {
         emailVerified: true
       })
    .then(function(userRecord) {// See the UserRecord reference doc for the contents of userRecord.
			console.log("Successfully updated user", userRecord.toJSON());
     var deleteDoc = db.collection('Email-Verifications').doc(hash).delete(); //Delete the email-verification document since it is no longer needed.
		 return response.status(200).send(generateVerificationSuccessRedirect());
	 	})
		.catch(function(error) {
     		console.log("Error updating user:", error);
     		return response.status(500);
     });
   }})
	 .catch(err => {
	   console.log('Error getting document', err);
	   return response.status(500);
   });
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

router.get('/socialmedia_all_posts', (req, res) => {
  	if (isAuthenticated(req)) {
		firebase.socialmediaAllPosts(req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.get('/socialmedia_post', (req, res) => {
  	if (isAuthenticated(req)) {
		firebase.socialmediaPost(req, res);
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

router.post('/socialmedia_post', (req, res) => {
  	if (isAuthenticated(req)) {
  		console.log("Request in router", req.files);
  		if (req.files.imageId.name != "") {
			drive.uploadFile(req.body.title, req.files.imageId.mimetype, req.files.imageId.tempFilePath, req, res);
  		} else {
			firebase.saveSocialmediaPost(req, res);
  		}
	} else {
    	res.render(path.join(__dirname+'/../views/login.ejs'));
	}
});

module.exports = router
