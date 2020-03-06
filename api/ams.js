module.exports = {
	timelineFor: function(status, timestamp, department) {
		let percentages = {
			'Submitted': '0',
			'Passed Data Check': '5',
			'In Review': '10',
			'Revisions Requested': '35',
			'Technical Review':	'50',
			'Final Review': '70',
			'Final Review Edits Requested': '90',
			'Ready to Publish': '100',
		};
		return percentages[status];
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
	},

	departments: function() {
		return [
			"Astrophysics",
			"Biochemistry",
			"Biology",
			"Chemistry",
			"Computer Science",
			"Engineering",
			"Environmental & Earth Science",
			"Mathematics",
			"Medicine",
			"Physics",
			"Policy & Ethics",
			"Production"
		];
	}

};