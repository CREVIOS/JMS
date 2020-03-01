// Google Firebase
var firebase = require("firebase/app");

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
	createArticle: function (object) {
		// Add a new document with a generated id.
		let addDoc = db.collection('articles').add(object).then(ref => {
		  console.log('Added article with ID: ', ref.id);
		});
	},

	getAllArticles: function () {
		// Get all articles in the collection.
		let articlesRef = db.collection('articles');
		let allArticles = articlesRef.get()
		.then(snapshot => {
		    snapshot.forEach(doc => {
		      console.log(doc.data());
		    });

		  	return snapshot;
		})
		.catch(err => {
			console.log('Error getting documents', err);
		});
	}
};