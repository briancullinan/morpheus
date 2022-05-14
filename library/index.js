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
// @Bootstrap()
function framework(env) {
	bootstrap

	load(env)

	init
}
// ^^^ should be able to load wordpress, ourselves, symphony projects, 
//   old drupal projects, phpBB, deployment frameworks, etc.

/*
Unfortunately, the software industry at large has made a giant mistep.
https://qz.com/646467/how-one-programmer-broke-the-internet-by-deleting-a-tiny-piece-of-code/
As history repeats itself, programmers include smaller, 
stupider code in their projects. This IDE aims to solve
all of that by making the stupid code declarative. This
leads to a much larger, prior mis-step that eventually
lead to NPM and the left-pad fiasco. The much larger 
mistep, like NPM is that rather than adding dependency
injection to projects and frameworks, creating less code
NPM actually becomes a delivery pipeline for MORE code.
How then, as a whole did dependency injection help NPM?
Doesn't it stand to reason that NPM should withold all
source code from my, provide some basic polyfills to
run my code locally, until NPM itself is wound through
it's scaffolding API and my codebase is compiled and run
in memory as an "Angular" or "React" project based on
the platform specifics I feel like providing myself.
But the codebase itself and the functionality would 
remain framework independent because of how NPM was 
designed. But that isn't the NPM we have today.

You can't benefit from dependency injection if the very
act of adding dependency injection to a project doubles
the code size with unit tests. Why not tests your unit tests?
Make sure the unit tests are working as expect? Seriously?

This leads me to the much larger software-industry wide
problem that rather than developing Object Oriented pattern
or RESTful pattern making our code bases smaller with 
less scaffolding, we've engineered ourselves into writing
10 times more scaffolding just so that we can be more
descriptive in the actual coding project. i.e. 100,000
lines of Razor engine code, where is it now? Wasted, 
because of too-tight-coupling of interconnected dependencies.
Why? Because the language promoted engineers design it
that way. Because of DI being overused.

This leads me to a much larger, possibly shared problem
between many disciplines. It's the failure to recognize 
that Residential stored lithium ion battiers have an 
enormous infrastructure technical debt, just like adding
any "pattern", no matter how novel adds 1 level of complexity
to the system, be it city management or code management.

In exchange for adding dependency injection as a technical
complexity in itself, the language and writing style needs
extra annoying rules to make sure we stay organized. Programmers
impose these rules on other programmers because they think
they know better. e.g:
* Tabs `\t` versus Spaces `\s`
* {} - curly brackets always on a new line
* "At least write some unit-tests"
* Middle-wares, boot-loaders, dependencies, imports, 
components / modules, code-complete, are all
just examples of framework level non-sense to
help programmers keep organized. I.e. opinionated 
programming styles.

Here's my optimal style:
* 30 to 100 lines of code per component file
* 1 to 2 functions, certainly no more than 10 per file
* A list of declarative statements. 
(these are where nicely stated Observables 
and transforms come in, in React, some code
looks good.)
* Real world use-case test functions and mock-data / results.
(i.e. use the component to generate the mock data.)
* Optimal component format:


// @Template - layout how component looks, should match UX
function component() {
	listOf
	component
	purposes
}

// @Declarations - give the component purpose
// @Component(production) - component varies slightly depending on env
({
purpose: doSomething
})

// @Component(development)
({
purpose: doSomethingElse
})

// @Test - if component() is the input function, generate() is the ouput
function generate(component) {
	if(production) {

	} else if (development) {

	}
}

// @Environment
({
production: [{data: ['use this data']}]
})
({
development: [{data: ['use this data instead']}]
})

Because using this declarative style shows up correctly in
a default JS syntax parser. It is also easily parsible
without a full lexographer and AST parse tree generator.
I don't need to import every javascript feature like
if I was using React static-class-style declarations. 
(not all bad.)

But most importantly, unlike React static class declarations,
this format should force us to write STATEMENTS. NOT BRANCHES.
That is the whole purpose of changing programing styles
to accomodate the extra complexity of dependency injection
is to reduce branching, no functions, no branching. 
No branching, no unit-tests. Add functions, need more
tests. (i.e. could write a more complex undoEval() to
undo the expectations for the branching pattern, more
on that I was thinking in patterns.js)


Following these rules, I suspect I can blur the lines
between `component` and `module` to the extent where
my module just becomes whatever programming problem
I am working on / designing at the time, and my components
are already inter-connected and documented however they 
need to be by the environment based linking system.

*/


// @Load()
function load(env, framework) {
	
	// TODO: connect @functiondeclaration because
	//   template system is connected in the next step
	// TODO: should move this to initAttributes 
	//   and call with @Bootstrap template for whole file
	//   weird to think about how to call a new function 
	//   before it's declared? remove the break; above?
	attributeCode(framework.globalCache['./repl/attrib.js'])
	//attributeCode(framework.globalCache['./template.js'])
	//templateQuine(framework.globalCache['./cache.js'])
	// TODO: start by rescanning our own attrib.js
	//   system to help with future attributing, 
	//   (i.e. add @add, @before, etc)
	console.log(framework)
	// TODO: ^^^ bind `framework.globalCache` to cache.js template, 
	//   then bind directories to another cache for 
	//   use with watchFiles() or temporary storage.
	// TODO: scan all files for template functions and cache
	//   seperately. then automatically create modules when 
	//   called based on init-object, naming scheme, and env.
	return 
	// TODO: when adding the entire library to Quine attributes should be
	//   applied by the outer-most context passing the functions in
	//   that way the entire library is guaranteed to run with the attribute
	//   system installed on every function. 
	// (even internally when I get the require() linker working)

	let oldEvaluate = framework.evaluateCode
	framework.newEvaluate = function newEvaluate(libCode) {
		let { aliases, functions } = framework
				.parseCode(libCode)
		let newModule = oldEvaluate(framework
				.wrapperQuine(framework, libCode)) // TODO: apply attributes when Quining
		Object.assign(framework, newModule)
		console.log(newModule())
		return newModule
	}
	framework.evaluateCode = framework.newEvaluate
	// BOOTSTRAP OUR OWN ATTRIBUTE SYSTEM ONTO ITSELF
	//framework.evaluateCode(libCode)
	console.log(framework)
	// next step, cache, will do this part automatically
	// ^^^ Can't skip that until step 5 when the template
	//   system is booted, no more bootstrapping, ever.


	if(env == 'native') {
		Object.assign(globalThis, framework)
		eval('emitCLI()')
		//console.log(quine(module)) // aka do Makefile / webpack
		// TODO: output documentation
		// TODO move to bottom of emitCLI()
		//   I can't because emitCLI() isn't loaded
		// @Exit()
		process.exit()
	}

	// COMPLEXITY: #6 - +1 ^^^ for automatically loading modules
	//                  -1 for using quine instead of build system? - total 1

	// TODO: now that templates are working the cache system
	//   can be loaded and functions wrapped with an abstracted environment
	
	// TODO: need cache system to use on templates as well
	//   then we can finish initTemplates() in this step
	//   i.e. matching file templates to @Bootstrap to
	//   automatically can initFilename if it exists without
	//   the need to use @Attributes. i.e. The Framework.
	
	// TODO: wrap the wrapper in it's own executable function
	//function wrap(context) {
	//	return function (functionBody) {
	//		return evaluateCode(wrapper(context, functionBody))
	//	}
	//}
	// TODO: make a complexity checker that makes sure
	//   there are no static declarations, only templates and objects
	// TODO: now that cache system is loaded, modules can 
	//   be automatically imported
	// ^^^ assign own aliasFunction names to context for later use?

	// TODO: give our code files flow, i.e. PWAs like React and M$
	//   are basically just file templates in /stacks/, mock everyone?

	// context = wrap()
	//Object.assign(context, context.evaluateCode(wrapperQuine(
	
	//)))

	// HOW MANY CONTEXTS DOES IT TAKE TO GET TO THE CENTER OF A PROGRAM? 6
	/*
	```
	namespace {
		class {
			// space for complexity
			function {
				// complexity we force devs to test
				if() {
				}
			}
		}
		// space for complexity
	}
	```

	OR!

	```
	// complexity filtered by checker
	// @Framework
	({
	property: environmental.impact()
	})
	// no room for complexity
	```

	*/

}


// @Init
if(typeof process != 'undefined') {
	// TODO: move back to index before including framework.js
	require('./env.js')
	require('./utilities/parse.js')
	//const {bootstrap} = require('./stacks/framework.js')
	//let framework = bootstrap(globalThis)
	// TODO: load template system, so I don't have 
	//   to write function () { MODULE_CODE } anymore
	// @Exit() for JS to C conversion
	//load('native', framework)
}

// TODO: this file is done, kind of poetic how this matches
/*

@Template

@Load

@Init - You are here, LOL

exit // part of init() context from platform env.js

*/
return // bubble out to not hit new templates below


// to put that another way:
({
bootstrap: require('./stacks/framework.js'),
load: load('native', framework),
init: emitCLI()
})

// would do the same thing using the new framework instead of 
//   all this bootstrapping code we needed to get started.

// TODO: It might be nice if I could just arbitrarily include code
//   in my page without like having to write <script src="" />
// TODO: SCSS compiler is/was native C, by now it's probably WASM.
//   but it might be nice to use that in templates with needing
//   `npm install scss` and 100,000 LoC with webpack. maybe a 
//   wrapper to convert basic SCSS structures to their output.

// I.E.
// to consume all Google cloud services, 
//    the declaration in cloud.js becomes something like:
// @Add(@Cloud,google)
({
boostrap: ['gutil', 'https://google.apis'],
load: middleware(['express', 'google cloud function mock']),
init: ['npm', framework] // boot itself in outer context
})
// That way, any time a write a script like copy(file)
//   upload can be replaced with a cloud service, or 
//   local fs.copyFileSync(), support for that environment
// Is deginated now using @Cloud(google) anywhere in the
//   global scope or above the compatible function.
// When the service is compiled made up of multiple
//   components, the linker can figure out if all the 
//   functions our service relies on is compatible with
//   the cloud service we're trying to run on.
//   i.e. copy(file) from Google to Google swaps out for
//     `gsutil -`, but running in a web-worker uses an RPC
//     call to a non-Google hosted VM that uses a backend-secured from OAuth
//     call to GCS REST API.
// Henceforth, the "framework" written in less than 30 LoC


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

// TODO: on more proof of concept to generate a google 
//    docs style website with ace editor and live cloud coding
//    for our own entire init system using 5 lines of code here
({

})

// TODO: make a wrapper for systemd style config files to use our own init() system, LOL.
//   the systemd haters are gonna hate this so much more, 
//   ("use systemd in Github Actions and Symfony projects alike!" - Hacker News)
// TODO: bootstrap old PHP project into PHP running jupyter kernel, 
//   then bootstrap running jupyter kernel with our own REPL service.
// TODO: write kernel.js declarations first, LOL, should output kernel 
//   installation file, run startup, and call API, as a template, reverse
//   the flow of our own REPL where onConsole from jupyter calls doConsole() inside doEval(), LOL
({

})

// TODO: auto-detect some language features and output a module
//   that can be run in different contexts. i.e. Makefile / doEval('./Makefile')
//   all could pass through a single require statement.
// but how to define it?

// TODO: drupal and symfony bootstrap demo

// TODO: generate `code bodies` for lessons in traditional formats 
//   for any language using these folding tools when loaded from
//   the IDE documentation module. With only the relevant API code 
//   blocks folded and listed nearby their usage.


// TODO: move to repl/env.js
/*

if (typeof WorkerGlobalScope !== 'undefined'
		&& self instanceof WorkerGlobalScope ) {
	emitService()
}
*/
