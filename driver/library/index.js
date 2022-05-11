

// It might be nice if I could just arbitrarily include code
//   in my page without like having to write <script src="" />
// TODO: SCSS compiler is/was native C, by now it's probably WASM.
//   but it might be nice to use that in templates with needing
//   `npm install scss` and 100,000 LoC with webpack. maybe a 
//   wrapper to convert basic SCSS structures to their output.

// TODO: auto-detect some language features and output a module
//   that can be run in different contexts. i.e. Makefile / doEval('./Makefile')
//   all could pass through a single require statement.
// but how to define it?
/*

*/
function bootstrap({library, require}, libraryFile) {
	// TODO: move require and __library down below libraryLookup
	if(typeof require != 'undefined') {
		let libCache = cache(library)
		for(let i = 0; i < libCache.length; i++) {
			
		}
	} // TODO: alternate require
	// TODO: INTERESTING IDEA, REPLACE GLOBALTHIS WITH 
	//   PLACEHOLDER FUNCTIONS FOR EVERYTHING IN THE LIBRARY,
	//   THE FIRST TIME THE FUNCTION IS USED, BOOT UP A CLOUD
	//   SERVICE TO HOST IT, REPLACE THE CALL IN GLOBALTHIS WITH
	//   THE NEW `RENDERED` FUNCTION.

	let customRequire = wrapperQuine({
		// provide a relative path to lib files in case
		//   lib code wants to refer to itself
		__library: library,
		__dirname: libraryFile.replace(/\/[^\/]*?$/, ''),
		__filename: libraryFile,
	}, 'return a + b')

	// TODO: keep returning templates until we can replace
	//   all the bootstrap parts of a function, or
	//   return a template to replace middleware components

}


// TODO: move to repl/env.js
if(typeof module != 'undefined') {

	// TODO: BOOTSTRAP?
	if(typeof require != 'undefined') {
		let path = require('path')
		let relativePath = path.relative(
			path.resolve(process.cwd()),
			path.resolve(__dirname))

		bootstrap(require, relativePath)
	}

	if(typeof process != 'undefined') {
		// javascript has a global context, not every language has
		//   this feature, might as well take advantage of it here
		globalThis.acorn = require('acorn')
		globalThis.acorn.walk = require('acorn-walk')
		globalThis.acorn.loose = require('acorn-loose')
		newRequire(__dirname, __dirname, __filename, './stacks/cli.js')
		emitCLI()
	}

	module.exports = {
		emitMakefile,
	}

}


if (typeof WorkerGlobalScope !== 'undefined'
		&& self instanceof WorkerGlobalScope ) {
	emitService()
}
