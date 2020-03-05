// Google Firebase
var firebase = require("firebase/app");
const path = require('path');
const fs = require('fs');
const ams = require("./ams.js")
const analytics = require("./analytics.js")

const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

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
			    req.session.authenticatedUser = user.user.email;
			    module.exports.getOverview(req, res);
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
							tempData.timeline = ams.timelineFor(tempData.status, tempData.timestamp, tempData.department);
							tempData.color = ams.colorForState(tempData.status);
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

				let staffRef = db.collection('staff').where("department", "==", tempUserData.department).get()
				.then(snapshot => {
					let deptStaffRaw = [];
				    snapshot.forEach(doc => {
				    	let tempData = doc.data();
						if (isActive(tempData.lastLogin)) {
							tempData.active = "success"
							tempData.activeIcon = "check"
						} else {
							tempData.active = "warning"
							tempData.activeIcon = "exclamation"
						}

				    	deptStaffRaw.push(tempData);
				    });

	    	    	res.render(path.join(__dirname+'/../views/dept_info.ejs'), {displayName: req.session.authenticatedUser,
																				department: tempUserData.department,
																				articles: articlesRaw,
																				staff: deptStaffRaw});
				})
				.catch(err => {
					console.log('Error getting documents', err);
		    		res.render(path.join(__dirname+'/../views/error.ejs'));
				});
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

	getOverview: function(req, res) {
		let stats = analytics.summary();
    	res.render(path.join(__dirname+'/../views/index.ejs'), { displayName: req.session.authenticatedUser, stats: stats});
	},

	getAllUsers: function(req, res) {
		// Add code to get all users
		let staffRef = db.collection('staff').get()
		.then(snapshot => {
			let allStaff = [];
		    snapshot.forEach(doc => {
		    	let tempData = doc.data();
				if (isActive(tempData.lastLogin)) {
					tempData.active = "success"
					tempData.activeIcon = "check"
				} else {
					tempData.active = "warning"
					tempData.activeIcon = "exclamation"
				}
		    	allStaff.push(tempData);
		    });

	    	res.render(path.join(__dirname+'/../views/members.ejs'), {displayName: req.session.authenticatedUser,
																		staff: allStaff});
		})
		.catch(err => {
			console.log('Error getting documents', err);
			res.render(path.join(__dirname+'/../views/error.ejs'));
		});
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
					tempData.id = doc.id;
					tempData.color = ams.colorForState(tempData.status);
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
		let collection = "articles";
		collection += req.query.dept.replace(/\ /g, "");
		let userRef = db.collection(collection).doc(req.query.id);
		let getDoc = userRef.get()
	  	.then(doc => {
	    	if (!doc.exists) {
  				res.render(path.join(__dirname+'/../views/error.ejs'));
	    	} else {
	    		let tempData = doc.data();
				tempData.timeline = ams.timelineFor(tempData.status, tempData.timestamp, tempData.department);
				tempData.color = ams.colorForState(tempData.status);
				tempData.id = doc.id;
				var statuses = ams.articleStatuses();
	    		res.render(path.join(__dirname+'/../views/article_overview.ejs'), { displayName: req.session.authenticatedUser,
	    																			article: tempData,
	    																			statuses: statuses });
	    	}
	  	})
	  	.catch(err => {
	    	console.log('Error getting document', err);
			res.render(path.join(__dirname+'/../views/error.ejs'));
	  	});
	},

	saveArticle: function(toUpdate, id, dept, req, res) {
		let collection = "articles";
		collection += dept.replace(/\ /g, "");
		let articles = db.collection(collection).doc(id);
		let updateSingle = articles.update(toUpdate);
		module.exports.articleOverview(req, res);
	},

	assignEditor: function(toUpdate, id, dept, req, res) {
		let now = new Date();
		let newEditor = {
			email: toUpdate['editor'],
			timestamp: now.toLocaleDateString()
		};
		let collection = "articles";
		collection += dept.replace(/\ /g, "");

		let articleRef = db.collection(collection).doc(id);
		let getDoc = articleRef.get()
	  	.then(doc => {
	    	if (!doc.exists) {
  				res.render(path.join(__dirname+'/../views/error.ejs'));
	    	} else {
	    		let tempData = doc.data();
	    		let currentEditors = tempData.editors;
	    		currentEditors.push(newEditor);
				let articles = db.collection(collection).doc(id);
				let updateSingle = articles.update({editors: currentEditors});
				module.exports.articleOverview(req, res);
	    	}
	  	})
	  	.catch(err => {
	    	console.log('Error getting document', err);
			res.render(path.join(__dirname+'/../views/error.ejs'));
	  	});
	}

};


function isActive(lastLogin) {
	if (typeof lastLogin !== "undefined") {
		let firstDate = new Date();
		let aDates = lastLogin.split("-");
		let secondDate = new Date(aDates[2], aDates[1]-1, aDates[0]);

		const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
		if (diffDays < 28) {
			return true;
		} else {
			return false;
		}
	}
}