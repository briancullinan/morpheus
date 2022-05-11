// THEORY
/*
By writing this entire REPL / @Attributes
extension for nodeJS, I'll be able to solve
any complexity of a visual communications 
problem, my code base can grow infinitely
without growing in complexity failling short
of usability. AND! as a side-effect, I'll never
need to write a component more than 1 or 2 
functions and some declarative framework code.
*/

// I.E.
// @Template
// @Framework(ideologies)
function framework(name) {
	bootstrap

	load(env)

	init
}
// should be able to load wordpress, ourselves, symphony projects, 
//   old drupal projects, phpBB, deployment frameworks, etc.

/*

*/

// TODO: parse our own file using the @Attribute system to load the REPL framework

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
// ^^^ should be able to load wordpress, ourselves, symphony projects, 
//   old drupal projects, phpBB, deployment frameworks, etc.


// I.E.
// to consume all Google cloud services, 
//    the declaration in cloud.js becomes something like:
({
boostrap: ['gutil', 'https://google.apis'],
load: middleware(['express', 'google cloud function mock']),
init: ['npm', framework] // boot itself in outer context
})
// TODO: same for AWS, because framework() is a consumer of
//   framework definition files these cloud providers provide
//   either in the form of consumable REST documentation, OR
//   better yet, native bindings for one of our supported REPL
//   languages. Which means with one more declaration, and can
//   harmoniously connect C# to PHP, JS to Node-GYP definitions, etc.
({

})

// TODO: one more proof of concept of convert attribute code to jupyter notebooks
({
	
})

// TODO: on more proof of concept to generate a google docs style website with 
//    ace editor and live cloud coding using 5 lines of code here
({

})

// TODO: bootstrap old PHP project into PHP running jupyter kernel, 
//   then bootstrap running jupyter kernel with our own REPL service.
// TODO: write kernel.js declarations first, LOL, should output kernel 
//   installation file, run startup, and call API, as a template, reverse
//   the flow of our own REPL where onConsole from jupyter calls doConsole() inside doEval(), LOL
({

})

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
