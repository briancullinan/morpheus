// WHEN I BUILT THIS IN JUPYTER NOTEBOOKS, JUST HAVING A SIMPLE
//   LIST OF AVAILABLE FUNCTIONS TIED TO THEIR FILE-TIMES MADE
//   THE WHOLE MODULE SYSTEM EASIER TO UNDERSTAND.
// BASICALLY, READ THE TOP LEVEL FUNCTION NAMES OUT OF FILES TO AUTOMATICALLY
//   MAKE MODULE.EXPORTS={}, AND INDEX.JS FILES IN QUINE.JS.
// GETTING KIND OF BORED OF THIS. NEED A FUNCTION TO LIST FUNCTIONS.

// this is the kind of alien code that doesn't look pretty
function list(functions) {
	let y = (/function\s+([a-z]+[ -~]*)\s*\(/gi);
	let funcs = []
	while(funcs.push((y.exec(functions) || []).pop())
			&& funcs[funcs.length-1]) {}
	return funcs.slice(0, -1)
}

let fileTimes
let libraryFunctions

// load a list of functions from each file in the specified folder
function load(library) {
	let needsUpdate = needs(library)
	if(!needsUpdate) {
		return
	}
	fileTimes[library] = needsUpdate
	let libCode = readFile(library)
	libraryFunctions[library] = list(libCode)
}

// skip reloading the file if the mtime hasn't changed
//   some little efficiency, I can't imagine a single 
//   library being too big to load on startup.
// CODE REVIEW, using a parameter to describe function
//   names since we no longer worry about collisions?
function needs(update) {
	if(!update.endsWith('.js')) {
		return false
	}
	let newFileTime = statFile(update).mtime.getTime()
		// already got this one, hasn't changed
	if(newFileTime !== fileTimes[update]) {
		return newFileTime
	}
	return false
}


function cache(library) {
	if(typeof fileTimes == 'undefined')
		fileTimes = {}
	if(typeof libraryFunctions == 'undefined')
		libraryFunctions = {}
	let libraryFiles = readDir(library, true)
	for(let i = 0; i < libraryFiles.length; i++) {
		load(libraryFiles[i])
	}
	// lol, rewrite our own file with cache data attached
	if(typeof module != 'undefined') {
		Object.assign(module.exports, {
			libraryFunctions: 
					JSON.stringify(libraryFunctions, null, 2),
			fileTimes: 
					JSON.stringify(fileTimes, null, 2),
		})
		// TODO: make work in browser so save language server requests
		let baseTemplate = template(init, module.exports)

		console.log(baseTemplate)
	}
	// writeFile(__filename, baseTemplate)

	return libraryFunctions
}

// lol, start weird stuff
// @Quine()
function init() {
	const CACHE_MARKER = '\n\n// DO NOT EDIT BELOW THIS LINE, AUTO-GENERATED\n\n'
	if(typeof module != 'undefined') {
		// javascript has a global context, not every language has
		//   this feature, might as well take advantage of it here
		globalThis.template = require('./quine.js').template
		globalThis.readDir = require('./env.js').readDir
		module.exports = {
			list,
			fileTimes,
			libraryFunctions,
			load,
			needs,
			cache,
			init,
		}
	}
}

init()


