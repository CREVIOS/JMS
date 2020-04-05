// Google Firebase
require('dotenv').config();

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
	apiKey: process.env.FIREBASE_API_KEY,
	authDomain: process.env.FIREBASE_AUTH_DOMAIN,
	databaseURL: process.env.FIREBASE_DB_DOMAIN,
	projectId: "ams-v4",
	storageBucket: process.env.FIREBASE_,
	messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.FIREASE_APP_ID,
	measurementId: process.env.MEASURE_ID
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
				let userRef = db.collection("staff").doc(user.user.email);
				let getDoc = userRef.get()
			  	.then(doc => {
			    	if (!doc.exists) {
		  				res.render(path.join(__dirname+'/../views/error.ejs'));
			    	} else {
			    		let tempData = doc.data();
					    req.session.authenticatedUser = tempData.email;
			    		req.session.authenticatedUserLevel = tempData.authorizationLevel;
					    updateUserLastLogin(tempData.email);
			    		module.exports.getOverview(req, res);
			    	}
			  	})
			  	.catch(err => {
			    	console.log('Error getting document', err);
					res.render(path.join(__dirname+'/../views/error.ejs'));
			  	});
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
																				authLevel: req.session.authenticatedUserLevel,
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
    	res.render(path.join(__dirname+'/../views/index.ejs'), { displayName: req.session.authenticatedUser, authLevel: req.session.authenticatedUserLevel, stats: stats});
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
	    																authLevel: req.session.authenticatedUserLevel,
																		staff: allStaff,
																		departments: ams.departments() });
		})
		.catch(err => {
			console.log('Error getting documents', err);
			res.render(path.join(__dirname+'/../views/error.ejs'));
		});
	},

	getFinalReviews: function(req, res) {
		// Get all articles in the collection.
		let articlesRef = db.collection('articles').where("status", "==", "Final Review").get()
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
					tempData.editors
					for (var i = tempData.editors.length - 1; i >= 0; i--) {
						if (tempData.editors[i].type == "final") {
							tempData.finalEditor = {email: tempData.editors[i].email, timestamp: tempData.editors[i].timestamp};
							if (withinDeadline(tempData.finalEditor.timestamp)) {
								tempData.color = "success";
							} else {
								tempData.color = "danger";
							}
							break;
						}
						tempData.finalEditor = {email: "", timestamp: ""};
					}
					if (tempData.finalEditor.email == "") {
						tempData.color = "warning";
					}
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

    		res.render(path.join(__dirname+'/../views/final_reviews.ejs'), {articles : articlesRaw,
	    																	displayName: req.session.authenticatedUser,
	    																	authLevel: req.session.authenticatedUserLevel,
	    																	statuses: ams.articleStatuses(),
	    																	types: ams.articleTypes(),
	    																	subjects: ams.subjects()});
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
    																	authLevel: req.session.authenticatedUserLevel,
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
	    																			authLevel: req.session.authenticatedUserLevel,
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
                let mailOpt = mailer.articleUpdated(art.author, editorsStr, art.title, art.status);
                mailer.sendEmail(mailOpt);
            }
        })
        .catch(err => {
            console.log('Error getting document', err);
            res.render(path.join(__dirname+'/../views/error.ejs'));
        });
        
        let article =db.collection("articles").doc(id);
		let updateSingle = article.update(toUpdate);

        if (toUpdate.status == "Published" &&
        	toUpdate.type == "Original Research") {
        	let post = ams.newSocialMediaPost(toUpdate);
			let addDoc = db.collection('socialmedia_posts')
						.add(post).then(ref => {});
        }

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

                let mailOpt = mailer.newEditor(newEditor.email, tempData.title);
                mailer.sendEmail(mailOpt);

				module.exports.articleOverview(req, res);
	    	}
	  	})
	  	.catch(err => {
	    	console.log('Error getting document', err);
			res.render(path.join(__dirname+'/../views/error.ejs'));
	  	});
	},

	socialmediaAllPosts: function (req, res) {
		// Get all articles in the collection.
		let articlesRef = db.collection('socialmedia_posts');
		let allArticles = articlesRef.get()
		.then(snapshot => {
			let collection = [];
		    snapshot.forEach(doc => {
		    	let tempData = doc.data();
				if ((typeof tempData.timestamp !== "object" && tempData.timestamp != "")) {
					tempData.id = doc.id;
					if (postOnTime(tempData.timestamp)) { tempData.color = "success"; } else { tempData.color = "warning"; }
			    	collection.push(tempData);
		    	}
		    });

			collection.sort(function(a,b){
				let bDates = b.timestamp.split("-");
				let aDates = a.timestamp.split("-");
				let bDate = new Date(bDates[2], bDates[1]-1, bDates[0]);
				let aDate = new Date(aDates[2], aDates[1]-1, aDates[0]);
			  	return bDate - aDate;
			});

			res.render(path.join(__dirname+'/../views/marketing/socialmedia_posts.ejs'), {posts: collection});
		})
		.catch(err => {
			console.log('Error getting documents', err);
    		res.render(path.join(__dirname+'/../views/error.ejs'));
		});
	},

	socialmediaPost: function(req, res) {
		let id = req.query.id;
		if (typeof id === "undefined") {
			res.render(path.join(__dirname+'/../views/marketing/socialmedia_post.ejs'), {post: {imageId: ams.defaultSocialMediaImage(),
																								author: req.session.authenticatedUser,
																								timestamp: ams.currentDate(),
																								status: 'Draft'},
																						statuses: ams.socialMediaStatuses()});
		} else {
			let userRef = db.collection('socialmedia_posts').doc(id).get()
		  	.then(doc => {
		    	if (!doc.exists) {
	  				res.render(path.join(__dirname+'/../views/error.ejs'));
		    	} else {
		    		let post = doc.data();
		    		post.id = doc.id;
		    		if (typeof post.imageId === "undefined") {
		    			post.imageId = ams.defaultSocialMediaImage();
		    		}
					res.render(path.join(__dirname+'/../views/marketing/socialmedia_post.ejs'), {post: post, statuses: ams.socialMediaStatuses()});
		    	}
		  	})
		  	.catch(err => {
		    	console.log('Error getting document', err);
				res.render(path.join(__dirname+'/../views/error.ejs'));
		  	});
		}
	},

	saveSocialmediaPost: function(req, res) {
		if (req.body.id != "" && typeof req.body.id !== "undefined") {
	        let article = db.collection("socialmedia_posts").doc(req.body.id);
			let updateSingle = article.update(req.body);
		} else {
			let toAdd = req.body;
			let addDoc = db.collection('socialmedia_posts').add(req.body).then(ref => {});
		}
		module.exports.socialmediaAllPosts(req, res);
	},

	signupPageRequest: function (req, res) {
		let userRef = db.collection("signupCodes").doc(req.query.code);
		userRef.get().then(doc => {
	    	if (!doc.exists) {
  				res.render(path.join(__dirname + '/../views/error.ejs'), {error: "You are not allowed to signup. If you copied the link make sure you also copy the string after the /signup."});
	    	} else {
	    		let tempData = doc.data();
	    		if (tempData.email == req.query.email) {
					res.render(path.join(__dirname+'/../views/signup.ejs'));
	    		}
	    	}
	  	})
	  	.catch(err => {
	    	console.log('Error getting code', err);
			res.render(path.join(__dirname+'/../views/error.ejs'));
	  	});
	},

	signupUser: function (req, res) {	
		var first = req.body["firstname"]; //document.getElementById("ftnm").value;
		var last = req.body["lastname"]; //document.getElementById("ltnm").value;
		var email = req.body["email"]; //document.getElementById("el").value;
		var location = req.body["timezone"]; //document.getElementById("tm").value;
		var department = req.body["department"]; //document.getElementById("ps").value;
		var role = req.body["role"]; //document.getElementById("lv").value;
		var verification = req.body["verification"]; //document.getElementById("lv").value;
		// var user = req.body["user"]; //document.getElementById("tt").value;
	    var data = {
	    	'authorizationLevel': 1,
			'departments': [department],
			'role': role,
			'location': location,
			'email': email,
			'firstname': first,
			'lastname': last,
			'lastLogin': '01-01-2020',
			'subteam': []
	    };
		var setDoc = db.collection('staff').add(data);

		var pass = req.body["password"]; //document.getElementById("pd").value;
		firebase.auth().createUserWithEmailAndPassword(email, pass)
		.catch(function(error) {
		  // Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			console.log(errorCode, errorMessage)
		})
		.then(function(userRecord) {
			res.render(path.join(__dirname+'/../views/login.ejs'), {});
			//add hashed strings to verification
		    // var setHash = db.collection('Email-Verifications').doc(email).set({userID: email});
			// var verificationLink = "http://www.ysjournal.com/confirm_email/" + email;
		})
	}
};

function updateUserLastLogin(username) {
	let currentTime = ams.currentDate();
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

function withinDeadline(date) {
	if (typeof date !== "undefined") {
		let firstDate = new Date();
		let aDates = date.split("-");
		let secondDate = new Date(aDates[2], aDates[1]-1, aDates[0]);

		const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
		if (diffDays < 10) {
			return true;
		} else {
			return false;
		}
	}
}

function postOnTime(date) {
	if (typeof date !== "undefined") {
		let firstDate = new Date();
		let aDates = date.split("-");
		let secondDate = new Date(aDates[2], aDates[1]-1, aDates[0]);
		if (secondDate <= firstDate) {
			return true;
		} else {
			return false;
		}
	}
}