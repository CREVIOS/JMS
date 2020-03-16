// READ / WRITE

function getQueue() {

}

function updateQueue() {
	
}




// TIME AUTOMATION

var cron = require('node-cron'); 
cron.schedule('0 0 * * *', () => {
	console.log("Running tracker routine");

	let messages = getQueue();
	for (var i = 0; i < messages.length; i++) {
		messages[i].trackerAlert();
	}
});
