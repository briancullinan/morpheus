// framework consumer


// TODO: add scaffolding from this library to any framework
//   i.e. generating components using existing tools

// TODO: combine with patterns to remove framework 
//   scaffolding and just list what an APP does.

// COMPLEXITY: #1 - bootstrapping a framework counts as 1 complexity
let BOOTSTRAP = [
	// COMPLEXITY: #2 - reusing eval is +1 complexity - total 2
	'./repl/eval.js', // to get parser service
	// COMPLEXITY: #3 - +1 for automatically renaming functions
	//                  -1 for removing functional context - total 2
	//                     and adding "format templates", i.e. @Template\n@template(env)\n@Test
	'./template.js',
	'./quine.js',
	// COMPLEXITY: #4 - adding aspects (@attributes) -1 complexity - total 1
	'./repl/attrib.js',
	// COMPLEXITY: #5 - +1 ^^^ for automatically importing library
	//                  -1 for removing module environment contexts - total 1
	'./cache.js',
	// TODO: generics, types, cache.js
]

// To import functions from other places and create `module`
//   they wrap the module in a function that give the code path
//   and filename context.
function wrap() {
	return (function (templateParams) {
		functionBody
	})
}

// but I'm going to modify this a little to accept parameters
function extractFunctions(context, libCode, functions, aliases) {
	let exportCode = functions
	.filter(function (f) { return f })
	.join(' , ') + ' , ' + aliases
	.map(function (a, i) { return a + ': ' + functions[i] })
	.filter(function (a, i) { return a && functions[i] })
	.join(' , ')
	// MORE THEORY ON THIS. WEIRD. WHEN JAVASCRIPT LOADS
	//   IF THERE IS A FUNCTION() DECLARATION, AND THEN
	//   SOME STATEMENTS BELOW IT WITH ERRORS, THE ENGINE
	//   APPARENTLY ONLY EVALUATES DOWN TO THE POINT OF 
	//   FINDING THE REFERENCE. THIS IS NOT WHAT I WOULD
	//   EXPECT. I THOUGHT THE ENTIRE {} BLOCK-CONTEXT
	//   WOULD BE EVALUATED FOR REFERENCE NAMES ON ENTRY,
	//   I DON'T KNOW WHY I EXPECTED THIS. I GUESS IN C THERE
	//   IS NO "GLOBAL" CONTEXT AT RUNTIME, ONLY STATIC WHICH
	//   IS DETERMINATED AT COMPILE TIME? THAT WOULD EXPLAIN
	//   WHY THIS WORKS:
	//   `return funcName; function funcName() {}; skips code with errors`
	// this format is just for getting the library
	//   started and then for evironmental declarations
	// once eval() is bootstrapped, all other evaluations
	//   from this point on can be handled by special functions.
	
	return wrap.toString()
		// keeping single parameter for context
		.replace('templateParams', '{' 
		+ Object.keys(context).concat(aliases)
		.filter(function (f, i, arr) { 
				return f && arr.indexOf(f) == arr 
		}).join(' , ') + '}')
		// adding templates with attributes so I never 
		//   have to write this kind of stuff again
		// WITH THE ADDED SIDE-EFFECT THAT ASSIGNMENT ISN'T ORDER 
		//   SPECIFIC FOR THE TEMPLATING SYSTEM, WE CAN CHECK ANY-
		//   WHERE IN THE ONE LEVEL FUNCTIONS FOR REQUIRED GLOBAL
		//   VARIABLE AND ADJUST IF IT'S MISSING WITH AN ERROR OR
		//   MISSING FEATURE. REQUIREMENTS ARE ASSIGNED ARBITRARILY
		.replace('functionBody', `return {${exportCode}};\n${libCode}`)

}


// That is pretty cool because then if you have a function
//   like doWeb(), or doServer(), you can wrap the environment
//   variables like process, fs, path, in this function to
//   run the same exact code in a different context.

function bootstrap(context) {
	debugger
	// TODO: use BOOTSTRAP from context.framework or 
	//   injection or something? so we can bootstrap 
	//   our own templated library files and provide 
	//   ({
	//    }) definitions as different environments
	if(typeof context.globalCache == 'undefined') {
		context.globalCache = {}
	}
	for(let i = 0; i < BOOTSTRAP.length; ++i) {
		let foundFile = findFile(BOOTSTRAP[i])
		// TODO: store libCode in something that our own
		//   project.js/cache.js can recognize so we don't
		//   need to keep reloading the file from now on.
		// How about, just like Module, except it's called:
		context.globalCache[BOOTSTRAP[i]] = readFile(foundFile).toString('utf-8')
		let extractionCode
		if(typeof context.parseCode != 'undefined') {
			let { aliases, functions } = alias(context,
					context.globalCache[BOOTSTRAP[i]])
			extractionCode = extractFunctions(context, 
					context.globalCache[BOOTSTRAP[i]], functions, aliases)
		} else {
			extractionCode = extractFunctions(context, 
					context.globalCache[BOOTSTRAP[i]], 
					['evaluate', 'parse'], 
					['evaluateCode', 'parseCode'])
		}
		let newModule = eval('(' + extractionCode + ')')()(context)
		//console.log(newModule)
		Object.assign(context, newModule)
	}
	return context
}

if(typeof module != 'undefined') {
	module.exports = {
		wrap,
		bootstrap
	}
}

function alias(context, libCode) {
	// CODE REVIEW, this is weird because I'm adding a template
	//   system so that in the next step I can do the thing this
	//   file is labelled to do - attributes.
	if(typeof context.parseCode == 'undefined') {
		throw new Error('Not bootstrapped!')
	}

	// add new function names detected to functions
	let { aliases, functions } = context.parseCode(libCode)
	//   for aliases(param) -> aliasParam so the parent
	//   function can distinguish it as a template.
	let placeholders = {}
	for(let i = 0; i < aliases.length; ++i) {
		if(!aliases[i] || !functions[i]) {
			continue
		}
		placeholders[aliases[i]] = function (...params) {
			debugger
			context[aliases[i]] = context[functions[i]]
			// replace in context on first use so we don't hit here again
			return context[functions[i]](...params)
		}
	}
	Object.assign(context, placeholders)
	// ^^^ in-case we accidentally use the expanded 
	//   API naming scheme inside our own component?
	// CODE REVIEW, side effects?
	return { aliases, functions }
}
