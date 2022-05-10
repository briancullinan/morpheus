// WHEN I BUILT THIS IN JUPYTER NOTEBOOKS, JUST HAVING A SIMPLE
//   LIST OF AVAILABLE FUNCTIONS TIED TO THEIR FILE-TIMES MADE
//   THE WHOLE MODULE SYSTEM EASIER TO UNDERSTAND.
// BASICALLY, READ THE TOP LEVEL FUNCTION NAMES OUT OF FILES TO AUTOMATICALLY
//   MAKE MODULE.EXPORTS={}, AND INDEX.JS FILES IN QUINE.JS.
let fileMtimes
let libraryFunctions

// GETTING KIND OF BORED OF THIS. NEED A FUNCTION TO LIST FUNCTIONS.
function listFunctions(libCode) {
	let y = (/function\s+([a-z]+[ -~]*)\s*\(/gi);
	let fileFunctions = []
	while(fileFunctions.push((y.exec(libCode) || []).pop())
			&& fileFunctions[fileFunctions.length-1]) {}
	fileFunctions.pop()
	return fileFunctions
}


function cacheLibrary(library) {
	const fs = require('fs')
	const {nodeReadDir} = require('./repl')
	// TODO: rewrite our own file with the cache attached
	let libraryFiles = nodeReadDir(library, true)
	let cacheTime = fs.statSync(__filename).mtime.getTime()
	if(typeof fileMtimes == 'undefined') fileMtimes = {}
	if(typeof libraryFunctions == 'undefined') libraryFunctions = {}
	for(let i = 0; i < libraryFiles.length; i++) {
		if(!libraryFiles[i].endsWith('.js')) {
			continue
		}
		let newFileTime = fs.statSync(libraryFiles[i]).mtime.getTime()
		if(newFileTime == fileMtimes[libraryFiles[i]]) {
			// already got this one, hasn't changed
			continue
		}
		fileMtimes[libraryFiles[i]] = newFileTime
		let libCode = fs.readFileSync(libraryFiles[i])
		libraryFunctions[libraryFiles[i]] = listFunctions(libCode)
	}
	const FILE_MARKER = 'DO NOT EDIT BELOW THIS LINE'
	let cacheFile = fs.readFileSync(__filename)
	let split = cacheFile.indexOf()
	let cacheLibrary = 'cacheLibrary: cacheLibrary,\n'
	if(split == -1) {
		cacheLibrary = 'cacheLibrary: (' + cacheLibrary.toString() + '),\n'
	}

	// TODO: would love to do this with quine but they are circular depended
	fs.writeFileSync(__filename, cacheLibrary + '\n'
		+ '\n// ' + FILE_MARKER + '\nmodule.exports = {\n'
		+ 'fileTimes: ' 
				+ JSON.stringify(fileMtimes, null, 2) + ',\n'
		+ 'fileFunctions: ' 
				+ JSON.stringify(fileFunctions, null, 2) + '\n'
		+ '};\n\n')

	return fileFunctions
}


// DO NOT EDIT BELOW THIS LINE
module.exports = {
	cacheLibrary
}



