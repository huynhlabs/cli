const clui = require('clui')
	, Spinner = clui.Spinner
	, os = require('os')
	, Path = require('path')
	, fs = require('fs-extra')
	, through2 = require('through2')
	, Promise = require('bluebird')
	, _ = require('lodash')
	, chalk = require('chalk')
	;

module.exports = function(FASTACK) {

	FASTACK.cwd = process.cwd();
	FASTACK.dir = FASTACK.cwd;
	FASTACK.globalConfig = Path.join(os.homedir(), '.fastack');
	FASTACK.localDir = Path.join(FASTACK.cwd, '.fastack');

	FASTACK.updateDelimiter = function() {
		var path = Path.relative(FASTACK.cwd, FASTACK.dir);
		var name = Path.basename(path) || Path.basename(FASTACK.cwd);
		FASTACK.vorpal
			.delimiter('fastack:' + chalk.cyan(name) + ' $');
	};

	FASTACK.updateDelimiter();

	FASTACK.traverse = function(dir, allowable, onData, completed) {
		if (!dir) throw new Error("Specify a directory to traverse");
		if (!allowable) allowable = true;
		if (!onData) onData = function() {};
		if (!completed) completed = function() {};

		var excludeHiddenDirs = through2.obj(function (item, enc, next) {
			var relPath = Path.relative(FASTACK.cwd, item.path);
			if (!(/(^|\/)\.[^\/\.]/g).test(relPath)) this.push(item);
			next();
		});

		var excludeNodeModules = through2.obj(function (item, enc, next) {
			var relPath = Path.relative(FASTACK.cwd, item.path);
			if (relPath.indexOf('node_modules') == -1) this.push(item);
			next();
		});

		var excludeIrrelevantFiles = through2.obj(function (item, enc, next) {
			var ext = Path.extname(item.path).substring(1);
			if (allowable == true) this.push(item);
			else if(_.contains(allowable, ext)) this.push(item);
			next();
		});

		return new Promise(function(resolve, reject) {
			var items = [];
			fs.walk(dir)
				.pipe(excludeHiddenDirs)
				.pipe(excludeNodeModules)
				.pipe(excludeIrrelevantFiles)
				.on('data', function(item) {
					items.push(item);
					onData(item);
				})
				.on('end', function() {
					completed(items);
					resolve(items);
				});
		});
	};

	try {
		var config = fs.readFileSync(Path.join(FASTACK.cwd, 'fastack.json'), 'utf8');
		config = JSON.parse(config);
		FASTACK.config = config;
	} catch(e) {
		FASTACK.config = {};
	}


	return new Promise(function(resolve, reject) {
		var localDir;
		try {
			localDir = fs.lstatSync(FASTACK.localDir);
			FASTACK.app = true;
		} catch (e) {
			if (e.code == 'ENOENT') {
				FASTACK.app = false;
			}
		}
		resolve();
	});
};