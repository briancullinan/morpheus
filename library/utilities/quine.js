// emit self in a cloud-compatible way.
// quines have a life-expectancy, we should be up-front with 
//   them about that so they don't come back to kill us like Roy.

// CODE REVIEW: I'VE COMBINED DEPENDENCY INJECTION FROM MY MAKEFILE
//   WITH EXPRESS STYLE MIDDLEWARES FOR FEATURE SPECIFICS.


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


// DONE! how I want wrapperQuine({}) to work
/*
// @Ignore
eval(function wrapperTemplate(functionBody) {
	return "function (__dirname, __filename, etc) {
		functionBody
	}"
})(__dirname, __filename, etc)
*/
// TODO: move into index.js, imply with @Attributes

function wrapper(quine, functionBody) {

	// here is the code that generates this silly script
	// ALL THIS WORK JUST SO I NEVER HAVE TO WRITE JAVASCRIPT INSIDE A STRING AGAIN
	// Here, object -> template function, template -> object
	//   function -> string, string -> object something like that
	let baseTemplate = template(
		'(' + wrap.toString() + ')', {
			templateParams: Object.keys(quine).join(', '),
			functionBody: functionBody.toString()
		})
	return '(' + eval(baseTemplate)().toString() + ')'
}

function quine(template, context) {
		
	// TODO: this kind of feels more like an functionQuine thing to do.
	//		.bind.apply(preparedFunction, [this]
	//				.concat())
	//   perhaps it can be distilled even furthur by functionQuine()
	let boundTemplate = evaluateCode('('
		+ eval(template)().toString() + ')')
		.apply(null, Object.values(context))
	return boundTemplate
}

// @Ignore
function evalQuine() {
	// TODO: recursively replace eval() with doEval() polyfill
}

function stringify(object) {
	return typeof object == 'function' 
			? (object.name /*object.toString().includes('native code') 
				? object.name : object.toString()*/ )
			: JSON.stringify(object + '')
}

// this is fairly meaningless code, but it proves a single concept
//   that less code can be used to generate more code.
// basically, all this code does is make a few changes to make
//   more code embeddable like such
// @Ignore
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


// #####################  \/ IN PROGRESS


// IT'S A WRAPPER TEMPLATE CREATOR
// @Ignore
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
// @Ignore
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

// convert makefile to jupyter notebook for storage in collab / download.
//   does jupyter support encryption?
// SELF EXTRACTOR LIKE BUSYBOX


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
// @Ignore
function middlewareTemplate(request, response) {

	// TODO: connect REPL node visitor to do template ${var} 
	//   replacements anywhere in the code, coming full circle

	// @Ignore
	function doRequest() {
		if(condition) {
			return request()
		}
		return request()
	}

	// @Ignore
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

// TODO: fileQuine
// TODO: convert Makefile / make.js reliance into this function for 
//   combining files into the output

// TODO: replQuine
// TODO: recursively convert back and forth to `{type:}`
//   objects and finalized objects i.e. `{error.fail} -> throw error`





// TODO: NEARLY TO THE POINT OF EMITTING TO THE CLOUD,
//   ALSO EMIT A RELOADER EXTENSION DURING DEVELOPMENT
//   https://github.com/arikw/chrome-extensions-reloader/blob/master/background.js
// INSTALL, RELOAD OUR OWN, UNINSTALL RELOADER
//   IF I DO THIS FROM LIBRARY/ THEN IT'S RECURSIVE.


// TODO: emitPlugin
// MAKE PLUGIN

// TODO: emitWeb
// MAKE PLUGIN


// TODO: emitService
// MAKE PLUGIN


// TODO: emitBuild
// MAKE PLUGIN


// TODO: emitEmitters
({
quine: [
	'onFrontend',
	'emitDownload',
	'domMessageResponseMiddleware',
]
})

// https://github.com/briancullinan/c2make-babel-transpiler
// TODO: emitMakefile

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
