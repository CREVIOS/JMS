var fs = require('fs');
const analyticsFilePath = "./api/amsAnalytics.json"
module.exports = {

	summary: function() {
		return getAnalytics(["submitted", "activeMembers", "articlesOnTime", "publishedThisMonth"]);
	},

	writeAnalytic: function(key, value, operation) {
		let current = getAllAnalytics();
		switch(operation) {
			case "add":
				current[key] += value;
				break;
			case "override":
				current[key] = value;
				break;
			default:
				console.log("Wrote invalid analytic: Key: ", key, " Value: ", value, "Operation:", operation);
		}

		let newJSON = JSON.stringify(current);
		fs.writeFile(analyticsFilePath, newJSON, function (err) {
		  if (err) throw err;
		  console.log('Analytics updated!', key, value);
		});
	}
};

const AnalyticsKeys = {
		submitted : "submitted",
		activeMembers: 'activeMembers',
		articlesOnTime: 'articlesOnTime',
		publishedThisMonth: 'publishedThisMonth'
};

function getAnalytics(args) {
	try {
	  	let content = fs.readFileSync(analyticsFilePath, { encoding: 'utf8' });
	  	let jsonObj = JSON.parse(content);
	  	let extracted = {};
	  	for (let i = 0; i < args.length; i++) {
			extracted[args[i]] = jsonObj[args[i]];
	  	};
	  	return extracted;
	} catch(err) {
	  console.error(err);
	}
};

function getAllAnalytics(args) {
	try {
	  	let content = fs.readFileSync(analyticsFilePath, { encoding: 'utf8' });
	  	let jsonObj = JSON.parse(content);
	  	return jsonObj;
	} catch(err) {
	  console.error(err);
	}
};