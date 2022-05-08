
// have to do this to build
const MIDDLEWARE_CLI = [
	'cliMiddleware'
]



function stdioMiddleware() {
	function sendMessage() {

	}

	function onMessage() {

	}

	// TODO: at least send signal

	// TODO: STDIN REPL, this will be neat because when antlr is
	//   added, I an instantly turn any language into a REPL 
	//   similar to `node -e "code..."` or bash, but any language, even MATLAB
	// Connecting R to fuse-fs would be weird. Or using MATLAB's interface
	//   for validating 3D scenes, or picking something out demo-files?
}


function emitCLI(something) {

	// TODO: -e "REPL"
	let {

	} = replEvalMiddleware()

	let {

		// TODO: do the wasm arguments / location.query / 
		//   process.arguments things all in one because its descriptive and small
		//   also attach to a standard NPM that works in browser and node ENV
	} = cliArgumentsMiddelware()

	// TODO: interactive mode

	if(process.stdout.isTTY) {
		
	}

	
}

if(typeof module != 'undefined') {
	module.exports = {
		emitCLI,
		stdioMiddleware, // TODO: use on mock web console to 
										//   send web-worker CLI commands?

	}
}

// waaay too much code
function parseCommandLine() {
	let wasmFile
	let startArgs = []
	let runProgram = false
	for(let i = 0; i < process.argv.length; i++) {
		let a = process.argv[i]
		if(a.match(__filename)) {
			runProgram = true
		} else if(a == '--') {
			continue
		} else if(a == 'node' || a.endsWith('/node')) {
			continue
		} else if(a.includes('.wasm')) {
			if(fs.existsSync(a)) {
				wasmFile = a
			} else if (path.join(__dirname, '../../../build/release-wasm-js/', a)) {
				wasmFile = path.resolve(path.join(__dirname, '../../../build/release-wasm-js/', a))
			} else {
				throw new Error('Wasm not found: ' + a)
			}
			startArgs.push(wasmFile)
			foundFiles.push(wasmFile)
		} else if (a) {
			startArgs.push(a)
			if(fs.existsSync(a) || (
				path.dirname(a).length > 1 && fs.existsSync(path.dirname(a)))
			) {
				foundFiles.push(a)
			} else {
				//console.log('WARNING: File not found: ' + a)
			}
		}
	}
}


if(typeof process != 'undefined') {
	emitCLI() // will decide if this is a tty
}


