
// have to do this to build
// TODO: somehow recursively pull environment 
//   arguments from somewhere else like xargs? implied -e? jupyter_ops?
if(typeof yargs != 'undefined') {

}

// TODO: in my jupter_ops I automatically converted function parameters to
//   the same name on the command, would be neat to automatically parse
//   aliases and descripts from code comments as a proof of concept here.
// Quines.


function onArg() {

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
			if(findFile(args[i])) {
				foundFiles.push(args[i])
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
		return emitCLI
	}
}


// TODO: use on mock web console to 
//   send web-worker CLI commands?



// just like Makefile?
/*
help: eval-commands ## print help docs in Makefile
	@echo Please see docs: https://github.com/briancullinan/planet_quake/blob/master/docs/make.md
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n $(subst \space, ,$(addsuffix \n,$(MAKES))) \033[36m\033[0m\n"} /^${subst (|,(,$(HELPFILTER)}[a-zA-Z0-9_-]*:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MKFILE)
*/
// BUT WE DON'T HAVE AWK SO USE REPL INSTEAD
function doHelp() {
	// TODO: source arguments from code
	if(typeof findFunction != 'undefined') {
		let lib = findFunction()
		let blockCount = 0
	}

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

