module.exports = {
	errorMessage: function(code) {
		let messages = { 401: 'You don\'t have access here. If you think it\'s an error contact technicalsupport@ysjournal.com'};
		return messages[code];
	}
};