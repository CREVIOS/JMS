// Google Firebase
var firebase = require("firebase/app");
const path = require('path');
const fs = require('fs');
const ams = require("./ams.js")
const analytics = require("./analytics.js")
const mailer = require("./mailer.js")
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
			    updateUserLastLogin(user.user.email);
			    module.exports.getOverview(req, res);
			}
		});
	},

	resetPassword: function(email, req, res) {
		var auth = firebase.auth();

		auth.sendPasswordResetEmail(email).then(function() {
  			res.render(path.join(__dirname+'/../views/login.ejs'));
		}).catch(function(error) {
  			res.render(path.join(__dirname+'/../views/error.ejs'), {error: error});
		});
	},

	getDepartmentInfo: function(req, res) {

		let userRef = db.collection('staff').doc(req.session.authenticatedUser);
		let getDoc = userRef.get()
	  	.then(doc => {
	    if (!doc.exists) {
  			res.render(path.join(__dirname+'/../views/error.ejs'));
	    } else {
	    	let tempUserData = doc.data();
	    	let dept = tempUserData.departments[0];
	    	if (tempUserData.departments[0] == "*") {
	    		tempUserData.departments = ams.departments();
	    		dept = tempUserData.departments[0];
	    	}
	    	if (req.query.department != "") {
	    		for (var i = tempUserData.departments.length - 1; i >= 0; i--) {
	    			if (tempUserData.departments[i] == req.query.department) {
	    				dept = req.query.department;
	    				break;
	    			}
	    		}
	    	}
			let articlesRef = db.collection('articles').where("subject", "==", dept).get()
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
							tempData.timeline = ams.timelineFor(tempData.status, tempData.timestamp, dept);
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

				let staffRef = db.collection('staff').where("departments", "array-contains", dept).get()
				.then(snapshot => {
					let deptStaffRaw = [];
					let senior = "";
				    snapshot.forEach(doc => {
				    	let tempData = doc.data();
				    	if (tempData.authorizationLevel >= 2) {
				    		senior += tempData.firstname + " " + tempData.lastname + " ";
				    	}

						if (isActive(tempData.lastLogin)) {
							tempData.active = "success";
							tempData.activeIcon = "check";
						} else {
							tempData.active = "warning";
							tempData.activeIcon = "exclamation";
						}

						let articlesAssignedString = "";
						for (var i = articlesRaw.length - 1; i >= 0; i--) {
							if (articlesRaw[i].status == "Revisions Requested" || articlesRaw[i].status == "Final Review Edits Requested") {
								continue;
							}

							for (var j = articlesRaw[i].editors.length - 1; j >= 0; j--) {
								if (articlesRaw[i].editors[j].email == tempData.email) {
									articlesAssignedString += "\"" + articlesRaw[i].title + "\" ";
								}
							}
						}

						tempData.articlesAssigned = articlesAssignedString;
				    	deptStaffRaw.push(tempData);
				    });

	    	    	res.render(path.join(__dirname+'/../views/dept_info.ejs'), {displayName: req.session.authenticatedUser,
																				department: dept,
																				articles: articlesRaw,
																				staff: deptStaffRaw,
		    																	statuses: ams.articleStatuses(),
    																			types: ams.articleTypes(),
    																			departments: tempUserData.departments,
    																			senior: senior});
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
					tempData.active = "success";
					tempData.activeIcon = "check";
				} else {
					tempData.active = "warning";
					tempData.activeIcon = "exclamation";
				}


				tempData.department = tempData.departments.join(", ");

		    	allStaff.push(tempData);
		    });

	    	res.render(path.join(__dirname+'/../views/members.ejs'), {	displayName: req.session.authenticatedUser,
																		staff: allStaff,
																		departments: ams.departments() });
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
    																	displayName: req.session.authenticatedUser,
    																	statuses: ams.articleStatuses(),
    																	types: ams.articleTypes(),
    																	subjects: ams.subjects()});
		})
		.catch(err => {
			console.log('Error getting documents', err);
    		res.render(path.join(__dirname+'/../views/error.ejs'));
		});
	},

	articleOverview: function(req, res) {
		let userRef = db.collection("articles").doc(req.query.id);
		let getDoc = userRef.get()
	  	.then(doc => {
	    	if (!doc.exists) {
  				res.render(path.join(__dirname+'/../views/error.ejs'));
	    	} else {
	    		let tempData = doc.data();
				tempData.timeline = ams.timelineFor(tempData.status, tempData.timestamp, tempData.subject);
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
        db.collection("articles").doc(id).get()
        .then(doc => {
            if (!doc.exists) {
                console.log("Mailer can't find doc " + id);
            } else {
                let art = doc.data();
                let editorsStr = art.editors.map(function(elem){
   					return elem.email;
				}).join(",");	
                mailer.articleUpdated(art.author, editorsStr, art.title, art.status);
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.render(path.join(__dirname+'/../views/error.ejs'));
        });

        let article =db.collection("articles").doc(id);
		let updateSingle = article.update(toUpdate);
		module.exports.articleOverview(req, res);
	},

	assignEditor: function(toUpdate, id, dept, req, res) {
		let now = new Date();
		let newEditor = {
			email: toUpdate['editor'],
			timestamp: now.toLocaleDateString()
		};

		let getDoc = db.collection("articles").doc(id).get()
	  	.then(doc => {
	    	if (!doc.exists) {
  				res.render(path.join(__dirname+'/../views/error.ejs'));
	    	} else {
	    		let tempData = doc.data();
	    		let currentEditors = tempData.editors;
	    		currentEditors.push(newEditor);
				let articles = db.collection("articles").doc(id);
				let updateSingle = articles.update({editors: currentEditors});
			  	mailer.newEditor(newEditor.email, tempData.title);
				module.exports.articleOverview(req, res);
	    	}
	  	})
	  	.catch(err => {
	    	console.log('Error getting document', err);
			res.render(path.join(__dirname+'/../views/error.ejs'));
	  	});

	}

};

function updateUserLastLogin(username) {
	let currentDate = new Date();
	let dd = currentDate.getDate();
	let mm = currentDate.getMonth() + 1;
	let yyyy = currentDate.getFullYear();

	let currentTime = dd + "-" + mm + "-" + yyyy;
	let articles = db.collection("staff").doc(username);
	let updateSingle = articles.update({lastLogin: currentTime});
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


// function signupStaff() {
// 	// Add code to get all users
// 	let staffRef = db.collection('staff').get()
// 	.then(snapshot => {
// 		let count = 0;
// 	    snapshot.forEach(doc => {
// 	    	count += 1;
// 	    	let tempData = doc.data();
// 	    		    	console.log(tempData.firstname, tempData.email);
// 	    	firebase.auth().createUserWithEmailAndPassword(tempData.email.trim(), "RANDOMysjNewAMSv4PASS%").catch(function(error) {
// 			  var errorCode = error.code;
// 			  var errorMessage = error.message;
// 			  console.log(errorCode, errorMessage, tempData.email);
// 			});
// 	    });
// 	    console.log(count);
// 	})
// 	.catch(err => {
// 		console.log('Error getting documents', err);
// 	});
// }

// signupStaff();