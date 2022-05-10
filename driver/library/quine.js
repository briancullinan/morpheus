// emit self in a cloud-compatible way.
// SELF EXTRACTOR LIKE BUSYBOX
// quines have a life-expectancy, we should be up-front with 
//   them about that so they don't come back to kill us like Roy.

// convert makefile to jupyter notebook for storage in collab / download.
//   does jupyter support encryption?

// CODE REVIEW: I'VE COMBINED DEPENDENCY INJECTION FROM MY MAKEFILE
//   WITH EXPRESS STYLE MIDDLEWARES FOR FEATURE SPECIFICS.

// this is some nice distilling
// BASIC TEMPLATE SYSTEM, find and replace tokens
// Source: https://stackoverflow.com/questions/29182244/convert-a-string-to-a-template-string
String.prototype.interpolate = function interpolateTemplate(params) {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${this}\`;`)(...vals);
}


// BASIC TEMPLATE SYSTEM, find and replace tokens
function replaceParameters(templateString, object) {
	let params = Object.keys(object)
	let values = Object.values(object)
	for(let i = 0; i < params.length; i++) {
		templateString =
				templateString.replace(
						new RegExp(params[i], 'g'), values[i])
	}
	return templateString
}

// OKAY, THEORY, THE BASIS BEHIND ALL MUSTACHE / LATEX / RAZOR / SCSS
//   TEMPLATING ENGINES IS THE ABILITY TO REPLACE STRINGS.
//   TO REPLACE STRINGS IN CODE WITH STRINGS OF OTHER CODES.
//   SO TO GENERALIZE THIS, BUILDING A TYPED-QUINE 
//   (TYPED QUINE - 1-LEVEL OF COMPLEXITY MORE THAN A QUINE
//   IT OUTPUTS ITSELF IN THE NEXT PHASE, FUNCTION -> STRING,
//   STRING -> FUNCTION. I.E. A COMPILER-QUINE WOULD BE 
//   COMPILER -> PROGRAM, PROGRAM -> STRING, STRING -> COMPILER
//   TO MAKE A SELF HOSTED QUINE, I WOULD INCLUDE THIS QUINE 
//   INSIDE A COMPILER QUINE ALONG SIDE THE EXISTING COMPILER CODE.
//   THIS WOULD AUTOMATICALLY SPIT OUT A SELF-HOSTED COMPILER WITH 
//   ZERO UPDATES, SO IT SELF-HOSTS ITSELF INSTEAD OF THE PREVIOUS
//   VERSION.

// The basic layout of a function is like this
function basicFunction(templateParams) {
	functionBody
}

// I didn't decide on this, ECMA did.
// Then, to import functions from other places and create `module`
//   they wrap the module in a function that give the code path
//   and filename context.
function wrapperTemplate() {
	return (function (templateParams) {
		functionBody
	})
}

// That is pretty cool because then if you have a function
//   like doWeb(), or doServer(), you can wrap the environment
//   variables like process, fs, path, in this function to
//   run the same exact code in a different context.

// DONE! how I want wrapperQuine({}) to work
/*
eval(function wrapperTemplate(functionBody) {
	return "function (__dirname, __filename, etc) {
		functionBody
	}"
})(__dirname, __filename, etc)
*/
function wrapperQuine(object, functionBody) {

	// here is the code that generates this silly script
	// ALL THIS WORK JUST SO I NEVER HAVE TO WRITE JAVASCRIPT INSIDE A STRING AGAIN
	// Here, object -> template function, template -> object
	//   function -> string, string -> object something like that
	let baseTemplate = replaceParameters(
		'(' + wrapperTemplate.toString() + ')', {
			templateParams: Object.keys(object).join(', '),
			functionBody: functionBody.toString()
		})
		
	// TODO: this kind of feels more like an functionQuine thing to do.
	//		.bind.apply(preparedFunction, [this]
	//				.concat())
	//   perhaps it can be distilled even furthur by functionQuine()
	let bindTemplate = replaceParameters(
		'(' + eval(baseTemplate)().toString() 
				+ ').bind(null, templateValues)', {
			// automatically fold parameters from a template into
			//   object names
			templateValues: '[' + Object.values(object)
					.map(convertFunctions).join(',\n\t') + ']'
		})
	return bindTemplate
}

function convertFunctions(v) {
	return typeof v == 'function' 
			? v.toString() 
			: JSON.stringify(v + '')
}

// this is fairly meaningless code, but it proves a single concept
//   that less code can be used to generate more code.
// basically, all this code does is make a few changes to make
//   more code embeddable like such
(function wrapperOutput(__dirname , __filename , __library) {
	return a + b
}).bind(null, [
	"/Users/briancullinan/morpheus/driver/library",
	"/Users/briancullinan/morpheus/driver/library/quine.js",
	"/Users/briancullinan/morpheus/driver/library"])
	
// TODO: this combined with @Attributes will make it super 
//   easy for me to polyfill any runContext, with any language feature,
//   with different evironments, as I reload the library code multiple times
//   lib code could even be loaded in multiple places used like a template.
//   i.e. in a worker it uses both virtualFS and some remote cloud FS.
// FINALLY, these 3 lines of code generate the much wordyer function above
//	console.log('output: ', wrapperQuine({
//			__dirname, __filename, __library: __dirname }, 'return a + b'))


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
function bootstrapRequire(library, libraryFile) {
	
	// TODO: move require and __library down below libraryLookup
	if(typeof require != 'undefined') {
		let {nodeReadDir} = require('./repl')
		let libCode = nodeReadDir('./', true)
		console.log(libCode)
		let y = (/function\s+([a-z]+[ -~]*)\s*\(/gi);
		let z
		let libFunctions = []
		while(null != (z=y.exec(libCode))) {
			libFunctions.push(z[1])
		}
		console.log(libFunctions)
	} // TODO: alternate require

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


// #####################  \/ IN PROGRESS


// IT'S A WRAPPER TEMPLATE CREATOR
function templateQuine(templateString) {
	// TODO: same as `wrapperQuine` quine but replacing template
	// TODO: this should generate a function that takes a string 
	//   as an argument and generates a function body inside 
	//   the previously configured context that create the function.

	/*
	i.e. templateQuine(middlewareTemplate, {
			request: onMessage,
			response: sendMessage,
	}) 
	*/

	// TODO: GET REPL WORKING NOW THAT TEMPLATES WORK

	//if(typeof templateString == 'function'
	//		&& typeof arguments[1] == 'object') {
	//}
	throw new Error('Not implemented!')
}



// TODO: do this thing where the notebooks export to seperate files
//   and then convert seperate files and comments back into notebooks
//   then wind it up as an RPC service.

// I ALWAYS HATED MODULE.EXPORTS, REQUIRE, IMPORT, LET'S APPEND
//   THE REQUIRE COMMAND SO THAT ALL INCLUDES AFTER ARE IMPLIED
/*
require.extensions['.ipynb'] = function(module, filename) {
if (meetsPermissions(module)) return jsloader.apply(this, arguments);
	throw new Error("You don't have the necessary permissions");
}
*/


// THIS IS BASICALLY ALL WEBPACK / require() DOES.
// TODO: the functionQuine does 1 pass rotation on return types
//   i.e. function -> string, string -> function
function functionQuine(entryFunction) {
	if(typeof entryFunction == 'function') {
		return entryFunction.toString()
	} else
	if(typeof entryFunction == 'undefined') {
		return functionQuine
	} else
	if(entryFunction.toString().includes('native code')) {
		throw new Error('Include the native quine.')
	} else {
		return eval(`(${entryFunction.toString()})`)
	}
	// TODO: include a list of functions in winding
	//   convert an object like module exports to 
	//   functional names, templateQuine and functionQuine
	//   can be used together
}

function evalQuine() {
	// TODO: recursively replace eval() with doEval() polyfill
}

// TODO: MUSTACHE STYLE

// TODO: use template quine to convert this so I never
//   have to write middleware again
// TODO: now I only have to write 
/*
```
templateQuine({
	doRequest: sendMessage,
	doResponse: onResponse,
	doInit: initMessageResponse,
})

// OR:

middlewareQuine(sendMessage, onResponse, initMessageResponse)
```
*/

// TODO: doMiddleware(onMessage, sendRequest)

// now all middlewares can use the same event names
//   because the attribute system will replay the context
//   before templateQuine() runs again, so it will inject
//   different functions depending on context.
/*
i.e. templateQuine(middlewareTemplate, {
		request: onMessage,
		response: sendMessage,
}) 
*/
function middlewareTemplate(request, response) {

	// TODO: connect REPL node visitor to do template ${var} 
	//   replacements anywhere in the code, coming full circle

	function doRequest() {
		if(condition) {
			return request()
		}
		return request()
	}

	function doResponse() {
		if(condition) {
			return response()
		}
		return response()
	}

	doInit()

	return {
		doRequest,
		doResponse,
	}

}

function fileQuine() {
	// TODO: convert Makefile / make.js reliance into this function for 
	//   combining files into the output
}

function replQuine() {
	// TODO: recursively convert back and forth to `{type:}`
	//   objects and finalized objects i.e. `{error.fail} -> throw error`

}





// TODO: move to repl/env.js
if(typeof module != 'undefined') {

	// TODO: BOOTSTRAP?
	if(typeof require != 'undefined') {

		let path = require('path')
		bootstrapRequire(path.relative(
			path.resolve(path.join(__dirname, './repl')),
			path.resolve(__dirname)), './repl/eval.js')
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



// TODO: NEARLY TO THE POINT OF EMITTING TO THE CLOUD,
//   ALSO EMIT A RELOADER EXTENSION DURING DEVELOPMENT
//   https://github.com/arikw/chrome-extensions-reloader/blob/master/background.js
// INSTALL, RELOAD OUR OWN, UNINSTALL RELOADER
//   IF I DO THIS FROM LIBRARY/ THEN IT'S RECURSIVE.


function emitPlugin() {
	// MAKE PLUGIN
}

function emitWeb() {
	// MAKE PLUGIN
}

function emitService() {
	// MAKE PLUGIN
}

function emitBuild() {
	// MAKE PLUGIN
}

function emitEmitters() {
	/*
	*/

	const MIDDLEWARE_FRONTEND = [
		'onFrontend',
		'emitDownload',
		'domMessageResponseMiddleware',
	].concat(MIDDLEWARE_DEPENDENCIES)
	

}

// https://github.com/briancullinan/c2make-babel-transpiler
function emitMakefile() {
	// okay, cmake, certainly I can make an index.html file with
	//   less than 100 LOC? if I'm going to cmake, why not use
	//   gulp? or maybe i'll switch to the beloved automake?
	//   maybe I can link my whole project together from seperate
	//   NPM modules. bored of babel, sick of looking a JavaScript
	//   and having 6 other steps to use the code. I need one
	//   function to consume it all, so I can build all the parts
	//   in their most naturally accepted form (i.e. source-fork)
	//   and not have to append the structure of the program.
	//   TODO: Optimally, how can I manage my appended workflow, 
	//   on top of Q3e directly.
	//   TODO: without adding complexity I should code and learn about
	//   cool 3D on Discord in the same window.

}

// TODO: single entry point for Makefile into the quine system, output
//   programs own output in various configurations to get it to run
//   in a multitude of environments.

/*
# basically, the above line is there until I can write a simple make/prolog parser
#   like this stupid failing dry-run.txt file I keep seeing, or add some other
#   obvious build process to the browser, so game files can be recompiled live.

# LOL, kind of a funny solution, build these into service_worker.js to serve
#   individual files from cache, just so that I can keep packaging my page
#   but can also debug the code, chrome debugger refuses to load large files.
#   they must not have seen guys talk making fun of microsoft's poor console
#   rendering speed.
*/

// TODO: then prove the concept by not "re-inventing" but rather,
//   re-displaying, download Google docs from Github source for all
//   cloud services, put 3 different code types to the right, all
//   RPC, CLI controls to the left in a forms panel, and 3D execution
//   graph in the engine with path nodes leading to browser web pages/
//   console logs for booting services/ programs and services needed for build
//   should only need to swap out documentation source.



// TODO: prove concept for a "browser-stack" style service
// TODO: same concept for https://stackshare.io/ - show entire CI for connect parts
// TODO: operator overloading with classes
//   i.e. Service(express) + Service(aws) + REPL(node)
// https://stackoverflow.com/questions/44761748/compiling-python-to-webassembly
//            + WWW(scss) + WWW(python)  
// https://webdriver.io/
//            + Test(unit) + Test(browser)
// https://pages.github.com/ + some hosted service? functions?
//            + Deploy(github) + Deploy(https)


// SHORTER LIST OF DEPENDENCIES THAN EMSCRIPTEN?
const MIDDLEWARE_DEPENDENCIES = [
	'getRunId',
	'generateRunId',
	'asyncTriggerMiddleware',
	'encryptedResponseMiddleware',
	'installEncryptedAsyncMiddleware',
]
