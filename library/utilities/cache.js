// THEORY,
// A BUNCH OF FRAMEWORKS HAVE DIFFERENT WAYS OF "IMPORTING"
//   FUNCTIONS INTO A CONTEXT. IN C, AN #INCLUDE IS BASICALLY 
//   COPYING AND PASTING DECLARATIONS FROM .H FILES INTO WHERE THE 
//   #INCLUDE  IS USED. IN NODE AND JS, THERE IS IMPORT() AND REQUIRE()
//   JAVA AND PYTHON USE IMPORT. 
// MY PROPOSAL IS SIMPLE, MAKE A MANAGABLE PLAIN TEXT LIST
//   OF ALL THE TOP LEVEL LIBRARIES, NODE_MODULES/THESE-DIRS,
//   MAKE A CACHE LIST OF EVERY MODULE'S TOP LEVEL ENTRIES,
//   I.E. NODE_MODULES/MODS/INDEX.JS -> THESE FUNCTIONS
// THEN DERIVE THE FUNCTIONAL CONTEXT FROM THE USAGE, I.E.
//   NUMBER OF PARAMETERS, EXPECTED/DEDUCED TYPES.
//   YES, THE OPPOSITE OF IMPLICIT TYPED-SYSTEM IS THE EXTRA 
//     HARD WORK OF DEDUCTION. THIS WILL BE FEATURED IN MY UNIT TEST GENERATOR.

// NO MORE NEED FOR IMPORTS, ON ANY PROJECT, EVER AGAIN. BECAUSE 
//   NO MATTER WHAT THE COMPONENT IS, THE CONTEXT SHOULD BE DERIVABLE
//   FROM THE TOP 2 LAYERS OF MODULES. IT WOULD BE LIKE PUTTING A 
//   SEPERATE NODE_MODULES FOLDER INSIDE EVERY COMPONENT, THAT'S SILLY TOO.
//   INSTEAD WE DO IT WITH CODE.

// WHEN I BUILT THIS IN JUPYTER NOTEBOOKS, JUST HAVING A SIMPLE
//   LIST OF AVAILABLE FUNCTIONS TIED TO THEIR FILE-TIMES MADE
//   THE WHOLE MODULE SYSTEM EASIER TO UNDERSTAND.
// BASICALLY, READ THE TOP LEVEL FUNCTION NAMES OUT OF FILES TO AUTOMATICALLY
//   MAKE MODULE.EXPORTS={}, AND INDEX.JS FILES IN QUINE.JS.
// GETTING KIND OF BORED OF THIS. NEED A FUNCTION TO LIST FUNCTIONS.

// a basic file cache looks something like
// implied @Template is found on usage
// add a cache attribute so any time I need to write 
//   a script that looks up a directory, instead of writing
//   fs.readdir... I write one line: `@Cache(directory)`
//   and it returns to me a list of files from the directory
//   that I would have looked up but it only researches the
//   directories that have changed from the given root.
// I can even still write readDir() in the code, but the
//   attribute will replace it with it's "infused idempotent mtime
//   technology" listed below.
// @Add(@Cache,init) 
function cache(files) {
	for(let i = 0; i < files.length; i++) {
		if(outdated(files[i])) {
			update(files[i])
		}
	}
	return files
}

// then create a function that does all these things
//   for convenience, or use in @Attributes, i.e. @Cache
//   will cache any Array hit in code of files or anything.
// any function that
//   matches the above pattern can use the @Cache attribute
//   to get one of the results from the list below. instead
//   of the repeat code
// attributes multiply the utility without adding complexity.

// implied @Template(cache) forces @Template implication
// @Add(Cache,template) // TODO: automatically create useful names based on functional diferences
({
// cache a file of function
// skip reloading the file if the mtime hasn't changed
//   some little efficiency, I can't imagine a single 
//   library being too big to load on startup.
// CODE REVIEW, using a parameter to describe function
//   names since we no longer worry about collisions?
outdated: statFile(update).mtime.getTime(),
// THIS SHIT, I DON'T NEED FUNCTION (FILE) { RETURN REGEX.MATCH(FILE) }
//   BECAUSE `UPDATE:` DOES A (LIST()).BIND(MATCH-CONTEXT), AUTOMATICALLY
update: list(/function\s+([a-z]+[ -~]*)\s*\(/gi),
})

({
// cache a whole directory
outdated: statFile(update).mtime.getTime(),
update: cache(library, true),
})

({
// cache a list of caches based on mtimes
outdated: newFileTime !== fileTimes[update],
update: append,
})

({
// cache all our library in compiled modules
outdated: script.length !== scriptBuffer.length,
update: vm.Script('', {
	produceCachedData: true,
	cachedData: scriptBuffer
}),
})

({
// make seperate modules out of every function in memory for nicer error reporting
outdated: script.length !== scriptBuffer.length,
update: function () {
	// TODO: copy this to module-maker
	//let relativePath = path.relative(
	//	path.resolve(path.join(__dirname, './repl')),
	//	path.resolve(__dirname))
	new Module(filepath, module)
	Module._cache[filepath] = ctxGlobal.module
},
})

// TODO: add another level of complexity and give some helper functions
//   these functions combine the auto-generated quines above into loops
//   of files, i.e. contextual proofs of concept. integration tests.
//   because these patterns make unit testing obsolete when I can
//   just write one unit test for the whole system, and never rewrite a
//   pattern like `dependency injection` or `middleware` or `cache` again.
// TODO: STORAGE(RSYNC)
// TODO: STORAGE(LVLWORLD DATA)
// TODO: STORAGE(MAKE) 
// DO THE SAME THING AS .D FILES FOR DEMONSTRATION ON NODE.JS
// TODO: STORAGE(OFFLINE)
// CACHE ALL REQUIRED GAME FILES FOR OFFLINE MODE

// implied @Output for middleware
function append(cache) {
	// TODO: make sure cache results end up back here 
	//   inside the code file below CACHE_MARKER
	writeFile(JSON.stringify(cache, null, 2))
}

// implied @Input takes input from cache
function update(file, cache) {
	if(file.endsWith('.js')) {
		append(cache)
	}
} // ).bind(null, loadCache)

function init(cache) {
	// TODO: load existing from disk based on cache descriptor
}

const CACHE_MARKER = '\n\n// DO NOT EDIT BELOW THIS LINE, AUTO-GENERATED\n\n'

/*
// lol, async output from @Quine
// @Ignore
function cache(botnet) {
	for(let i = 0; i < botnet.length; i++) {
		if(version < github.head) {
			update(server)
		}
	}
	return botnet
}
*/


