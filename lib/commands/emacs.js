const child_process = require('child_process')
;

// could add options if we wanted (e.g. a '-l')
module.exports = function(FASTACK) {
	return function(args, callback) {
		// child_process.exec(command[, options], callback)
		var command = "emacs " + args["file-name"];
		child_process.exec(command, function(error, stdout, stderr){
			if(error) FASTACK.logger.error(stderr);
			FASTACK.logger.log(stdout);
		});
		callback();
	}
};