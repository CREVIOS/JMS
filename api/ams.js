module.exports = {
	timelineFor: function(status, timestamp, department) {
		return {};
	},

	colorForState: function(status) {
		let colors = {
			'Submitted': 'danger',
			'Technical Review':	'primary',
			'Passed Data Check': 'info',
			'In Review': 'secondary',
			'Revisions Requested': 'warning',
			'Final Review': 'success',
			'Final Review Edits Requested': 'info',
			'Ready to Publish': 'dark',
			'Published': '6ABE71',
			'Rejected': 'DE3428',
			'Failed Data Check': 'E37735'};
		return colors[status]
	},

	articleStatuses: function() {
		return [
			'Submitted',
			'Technical Review',
			'Passed Data Check',
			'In Review',
			'Revisions Requested',
			'Final Review',
			'Final Review Edits Requested',
			'Ready to Publish',
			'Published',
			'Rejected',
			'Failed Data Check'];
	}
};