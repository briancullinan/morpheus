// WHEN I BUILT THIS IN JUPYTER NOTEBOOKS, JUST HAVING A SIMPLE
//   LIST OF AVAILABLE FUNCTIONS TIED TO THEIR FILE-TIMES MADE
//   THE WHOLE MODULE SYSTEM EASIER TO UNDERSTAND.
// BASICALLY, READ THE TOP LEVEL FUNCTION NAMES OUT OF FILES TO AUTOMATICALLY
//   MAKE MODULE.EXPORTS={}, AND INDEX.JS FILES IN QUINE.JS.
// GETTING KIND OF BORED OF THIS. NEED A FUNCTION TO LIST FUNCTIONS.

function contents() {
	contents
	list
	let fileFunctions
	let fileTimes
	load
	needs
	init
	cache
	init()
}

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
	if(typeof fileTimes == 'undefined')
		fileTimes = {}
	if(typeof libraryFunctions == 'undefined')
		libraryFunctions = {}
	fileTimes[library] = newFileTime
	let libCode = readFile(library)
	libraryFunctions[library] = listFunctions(libCode)
}

// skip reloading the file if the mtime hasn't changed
//   some little efficiency, I can't imagine a single 
//   library being too big to load on startup.
// CODE REVIEW, using a parameter to describe function
//   names since we no longer worry about collisions?
function needs(update) {
	return update.endsWith('.js')
			// already got this one, hasn't changed
			&& statFile(update).mtime.getTime()
					!== fileTimes[update]
}

// TODO: make work in browser so save language server requests
function cache(library) {
	let libraryFiles = readDir(library, true)
	for(let i = 0; i < libraryFiles.length; i++) {
		if(!needs(libraryFiles[i])) {
			continue
		}
		load(libraryFiles[i])
	}
	// lol, rewrite our own file with cache data attached
	let baseTemplate = replaceParameters(
			module.exports,
			{
				fileFunctions: 
						JSON.stringify(fileFunctions, null, 2),
				fileTimes: 
						JSON.stringify(fileTimes, null, 2),
			})

	console.log(baseTemplate)
	// writeFile(__filename, baseTemplate)

	return fileFunctions
}

// lol, start weird stuff
function init() {
	const CACHE_MARKER = '\n\n// DO NOT EDIT BELOW THIS LINE, AUTO-GENERATED\n\n'
	if(typeof module != 'undefined') {
		module.exports = {
			contents,
			list,
			load,
			needs,
			cache,
			init,
		}
	}
}

init()


