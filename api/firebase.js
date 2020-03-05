// Google Firebase
var firebase = require("firebase/app");
const path = require('path');
const fs = require('fs');

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");

// Set config vars for Firebase
var firebaseConfig = {
	apiKey: "AIzaSyAx2gYvwN7jNp1UJKzd72TzWNfNhmPEZ4w",
	authDomain: "ams-v4.firebaseapp.com",
	databaseURL: "https://ams-v4.firebaseio.com",
	projectId: "ams-v4",
	storageBucket: "ams-v4.appspot.com",
	messagingSenderId: "565534267801",
	appId: "1:565534267801:web:2fadb6cf262d8703fcdb08",
	measurementId: "G-DHLB8K7Z6R"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();


module.exports = {
	login: function(username, password, req, res) {
		firebase.auth().signInWithEmailAndPassword(username, password)
		.catch(function(error) {
		  	var errorCode = error.code;
		  	var errorMessage = error.message;
		  	console.log(errorMessage);
		  	console.log(errorCode);
	    	res.render(path.join(__dirname+'/../views/login.ejs'));
		})
		.then(function(user) {
			if (user) {
				console.log(user.user.email);
			    req.session.authenticatedUser = user.user.email;
		    	res.render(path.join(__dirname+'/../views/index.ejs'), { displayName: user.user.email });
			}
		});
	},

	getDepartmentInfo(req, res) {
		let userRef = db.collection('staff').doc(req.session.authenticatedUser);
		let getDoc = userRef.get()
	  .then(doc => {
	    if (!doc.exists) {
  			res.render(path.join(__dirname+'/../views/error.ejs'));
	    } else {
	    	let tempUserData = doc.data();
			let articlesRef = db.collection('articles' + tempUserData.department.replace(/\ /g, ""));
			let allArticles = articlesRef.get()
			.then(snapshot => {
				let articlesRaw = [];
			    snapshot.forEach(doc => {
			    	let tempData = doc.data();
					if ((typeof tempData.timestamp !== "object" && tempData.timestamp != "") &&
						tempData.status != "Published" &&
						tempData.status != "Failed Data Check" &&
						tempData.status != "Rejected" &&
						tempData.status != "DUPLICATE" &&
						tempData.subject == tempUserData.department) {
						tempData.id = doc.id;
						tempData.color = colorForState(tempData.status);
				    	articlesRaw.push(tempData);
			    	}
			    });
    	    	res.render(path.join(__dirname+'/../views/dept_info.ejs'), {displayName: req.session.authenticatedUser,
																			department: tempUserData.department,
																			articles: articlesRaw});
			})
			.catch(err => {
				console.log('Error getting documents', err);
	    		res.render(path.join(__dirname+'/../views/error.ejs'));
			});
	    }
	  })
	  .catch(err => {
	    console.log('Error getting document', err);
		res.render(path.join(__dirname+'/../views/error.ejs'));
	  });
	},

	logout: function(username, req, res) {
	    req.session.authenticatedUser = undefined;
    	res.render(path.join(__dirname+'/../views/login.ejs'), { displayName: req.session.authenticatedUser});
	},

	getOverview: function(req, res) {
    	res.render(path.join(__dirname+'/../views/index.ejs'), { displayName: req.session.authenticatedUser});
	},

	getAllUsers: function(req, res) {
		// Add code to get all users
	    res.render(path.join(__dirname+'/../views/members.ejs'), { displayName: req.session.authenticatedUser});
	},

	createArticle: function(object) {
		// Add a new document with a generated id.
		let addDoc = db.collection('articles').add(object).then(ref => {
		  console.log('Added article with ID: ', ref.id);
		});
	},

	getAllArticles: function(req, res) {
		// Get all articles in the collection.
		let articlesRef = db.collection('articles');
		let allArticles = articlesRef.get()
		.then(snapshot => {
			let articlesRaw = [];
		    snapshot.forEach(doc => {
		    	let tempData = doc.data();
				if ((typeof tempData.timestamp !== "object" && tempData.timestamp != "") &&
					tempData.status != "Published" &&
					tempData.status != "Failed Data Check" &&
					tempData.status != "Rejected" &&
					tempData.status != "DUPLICATE") {
			    	articlesRaw.push(tempData);
		    	}
		    });

			articlesRaw.sort(function(a,b){
				let bDates = b.timestamp.split("-");
				let aDates = a.timestamp.split("-");
				let bDate = new Date(bDates[2], bDates[1]-1, bDates[0]);
				let aDate = new Date(aDates[2], aDates[1]-1, aDates[0]);
			  	return bDate - aDate;
			});
    		res.render(path.join(__dirname+'/../views/articles.ejs'), { articles : articlesRaw,
    																	displayName: req.session.authenticatedUser });
		})
		.catch(err => {
			console.log('Error getting documents', err);
    		res.render(path.join(__dirname+'/../views/error.ejs'));
		});
	},

	articleOverview: function(req, res) {
		let userRef = db.collection('articles').doc(req.query.id);
		let getDoc = userRef.get()
	  	.then(doc => {
	    	if (!doc.exists) {
  				res.render(path.join(__dirname+'/../views/error.ejs'));
	    	} else {
	    		let tempData = doc.data();
	    		res.render(path.join(__dirname+'/../views/article_overview.ejs'), { displayName: req.session.authenticatedUser,
	    																			article: tempData});
	    	}
	  	})
	  	.catch(err => {
	    	console.log('Error getting document', err);
			res.render(path.join(__dirname+'/../views/error.ejs'));
	  	});
	}
};


function colorForState(status) {
	let colors = {
		'Submitted': 'danger',
		'Technical Review':	'primary',
		'Passed Data Check': 'info',
		'In Review': 'secondary',
		'Revisions Requested': 'warning',
		'Final Review': 'success',
		'Ready to Publish': 'dark',
		'Published': '6ABE71',
		'Rejected': 'DE3428',
		'Failed Data Check': 'E37735'};
	return colors[status]
};
