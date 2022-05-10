// WHEN I BUILT THIS IN JUPYTER NOTEBOOKS, JUST HAVING A SIMPLE
//   LIST OF AVAILABLE FUNCTIONS TIED TO THEIR FILE-TIMES MADE
//   THE WHOLE MODULE SYSTEM EASIER TO UNDERSTAND.
// BASICALLY, READ THE TOP LEVEL FUNCTION NAMES OUT OF FILES TO AUTOMATICALLY
//   MAKE MODULE.EXPORTS={}, AND INDEX.JS FILES IN QUINE.JS.

function cacheLibrary(library) {
	const fs = require('fs')
	// TODO: rewrite our own file with the cache attached
	let {nodeReadDir} = require('./repl')
	let libraryFiles = nodeReadDir(library, true)
	// TODO: INTERESTING IDEA, REPLACE GLOBALTHIS WITH 
	//   PLACEHOLDER FUNCTIONS FOR EVERYTHING IN THE LIBRARY,
	//   THE FIRST TIME THE FUNCTION IS USED, BOOT UP A CLOUD
	//   SERVICE TO HOST IT, REPLACE THE CALL IN GLOBALTHIS WITH
	//   THE NEW `RENDERED` FUNCTION.
	let libraryFunctions = {}
	let fileMtimes = {}
	for(let i = 0; i < libraryFiles.length; i++) {
		if(!libraryFiles[i].endsWith('.js')) {
			continue
		}
		fileMtimes[libraryFiles[i]] = fs.statSync(libraryFiles[i])
				.mtime.getTime()
		let libCode = fs.readFileSync(libraryFiles[i])
		let y = (/function\s+([a-z]+[ -~]*)\s*\(/gi);
		let fileFunctions = []
		while(fileFunctions.push((y.exec(libCode) || []).pop())
				&& fileFunctions[fileFunctions.length-1]) {}
		fileFunctions.pop()
		fileMtimes[libraryFiles[i]] = libraryFunctions
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



