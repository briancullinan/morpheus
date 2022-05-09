
// have to do this to build
const MIDDLEWARE_CLI = [
	stdioMiddleware,
	cliArgumentsMiddelware,
]

function stdioMiddleware(env) {
	let fs
	// TODO: at least send signal

	// TODO: STDIN REPL, this will be neat because when antlr is
	//   added, I an instantly turn any language into a REPL 
	//   similar to `node -e "code..."` or bash, but any language, even MATLAB
	// Connecting R to fuse-fs would be weird. Or using MATLAB's interface
	//   for validating 3D scenes, or picking something out demo-files?
	if(typeof FS != 'undefined') {
		fs = {
			existsSync: function () {
				return typeof FS.virtual[localName] != 'undefined'
			}
		}
	}

	// TODO: stdioMiddleware
	// CODE REVIEW, decent format for combining APIs between languages?
	if(typeof require != 'undefined') {
		try { 
			let { existsSync } = require('fs') // stdioMiddleware
			let { cwd: getCwd } = require('process')
			fs = {existsSync, getCwd}
		} catch (e) {
			if(!e.message.includes('find module')) {
				throw e
			}
		}
	}

	// TODO: memFS

	return fs
}


function cliArgumentsMiddelware(onArguments) {
	let yargs
	let fs
	// TODO: somehow recursively pull environment 
	//   arguments from somewhere else like xargs? implied -e? jupyter_ops?
	if(typeof require != 'undefined') {
		try { yargs = require('yargs') }
		catch (e) {
			if(!e.message.includes('find module')) {
				throw e
			}
		}
	}

	let { 
		existsSync, getCwd
	} = stdioMiddleware() // auto-detect

	function onArg() {

	}
	
	function getArguments(args) {
		if(typeof args == 'undefined') {
			if(typeof process != 'undefined') {
				args = getNativeQuery()
			}
			if(typeof window != 'undefined') {
				args = getWebQuery
			}
		}
		return args
	}

	function runArguments(args) {
		let foundFiles = []
		let runProgram = false
		if(typeof process != 'undefined') {
			let path = require('path')
			for(let i = 0; i < args.length; i++) {
				if(!args[i] || args[i] == '--') { continue } // calls from NPM
				else if(args[i].includes(__filename) 
						|| args[i].includes('quine')) {
					runProgram = true
				} else
				if(existsSync(path.join(getCwd(), args[i]))) {
					foundFiles.push(getCwd(), args[i])
				} else
				if(existsSync(args[i])) {
					foundFiles.push(args[i])
				} else
				if(existsSync(path.join(__dirname, args[i]))) {
					foundFiles.push(__dirname, args[i])
				} else
				if(args[i] == '-e') {
					runProgram = args[++i]
				}
			}
		}
		return {
			foundFiles,
			runProgram,
		}
	}

	// TODO: in my jupter_ops I automatically converted function parameters to
	//   the same name on the command, would be neat to automatically parse
	//   aliases and descripts from code comments as a proof of concept here.
	// Quines.

	return {
		getArguments,
		runArguments,
	}
}


// OKAY, REPL ADDS ONE COMPLEXITY IN ENCODING OBJECTS AND
//   MAKING STATUS CALLS. IT SEEMS ONLY REASONABLE THAT CLI
//   SHOULD ADD A COMPLEXITY BY NOT ONLY READING STDIO STDIN
//   BUT ALSO USING PIPING SYSTEM FOR COMMUNICATION LIKE ZMQ.

// TODO: in fairly short order, < 100 LOC I should have a pretty 
//   nice functioning shell, for running threads, listing process
//   that way, as I'm using REPL or Makefile, I can debug a process
//   send a signal command and actually see the code in my editor.
// TODO: consume pipes to other shell programs with child process, 
//   or COM/native attach to some standardized tty API?
// TODO: this seems kind of boring was thinking of a way to run and edit 
//   code from a shell, there is a shell based UI kit, and though
//   it would be cool to add the VLC shell renderer to game engine.
// TODO: demonstrate with code what make emacs and vim great?


function emitCLI(something) {
	let replEvalMiddleware
	if(typeof require != 'undefined') {
		replEvalMiddleware = require('./../repl/repl.js').replEvalMiddleware
	}

	// TODO: -e "REPL"
	let {
		doExecute,
	} = replEvalMiddleware()
	
	let {
		getArguments,
		runArguments,
		// TODO: do the wasm arguments / location.query / 
		//   process.arguments things all in one because its descriptive and small
		//   also attach to a standard NPM that works in browser and node ENV
	} = cliArgumentsMiddelware()
	

	let args = getArguments()
	let {
		foundFiles,
		runProgram,
	} = runArguments(args)

	// TODO: drop into interactive mode, launch other languages
	// TODO: train a voice AI to read my comments over Live stream
	if(runProgram) {
		// TODO:
		if(args[0].includes('.wasm')) {
		// TODO: foundFiles load from fs to FS.virtual if running wasm
		} else
		if(args.includes('-e')) {
			Promise.resolve(doExecute()).then(
				function (result) { console.log(result) })
		} else 

		// TODO: interactive mode
		if(process.stdin.isTTY) {
			doHelp()
			// TODO: keep the kernel thread open until we get an exit signal
			//doEval() // something like setInterval(live.exit)cancel())
			// TODO: doInteractive()
		} else {
			doHelp()
		}
	} else {
		return MIDDLEWARE_CLI
	}
}


// TODO: use on mock web console to 
//   send web-worker CLI commands?

if(typeof module != 'undefined') {
	module.exports = {
		... MIDDLEWARE_CLI,
		emitCLI,
	}
}

if(typeof process != 'undefined') {
	emitCLI() // will decide if this is a tty
}


function doHelp() {
	// TODO: source arguments from code
	// TODO: use yargs or use function parser from jupyter?
}

/*
const argv = yargs
	.command('lyr', 'Tells whether an year is leap year or not', {
	year: {
		description: 'the year to check for',
		alias: 'y',
		type: 'number'
	}
})
.option('time', {
	alias: 't',
	description: 'Tell the present Time',
	type: 'boolean'
})
.help()
.alias('help', 'h').argv;

if (argv.time) {
console.log('The current time is: ', new Date().toLocaleTimeString());
}

if (argv._.includes('lyr')) {
const year = argv.year || new Date().getFullYear();
if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
	console.log(`${year} is a Leap Year`);
} else {
	console.log(`${year} is NOT a Leap Year`);
}
}

console.log(argv);
*/

function getWebQuery() {
	let startup = []
	let query  = window.location.search.substring(1)
	let match
	while (match = (/([^&=]+)/g).exec(query)) {
		let val = decodeURIComponent(match[1])
		val = val.split(' ')
		val[0] = (val[0][0] != '+' ? '+' : '') + val[0]
		startup.push.apply(startup, val)
	}
	return startup
}

function getNativeQuery() {
	return Array.from(process.argv)
}

