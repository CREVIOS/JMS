var fs = require('fs');
const analyticsFilePath = "amsAnalytics.json"
module.exports = {

	summary: function() {
		let summaryAnalytics = {
			getAnalytics("submitted"),
		};
		return summaryAnalytics;
	}
};

function writeAnalytics(param) {
	fs.writeFile('mynewfile3.txt', 'This is my text', function (err) {
	  if (err) throw err;
	  console.log('Replaced!');
	});
};

function getAnalytics(param) {
	  fs.readFile(analyticsFilePath, function(err, data) {
}