// inject repl service with utilities attached into any page

// I'm not going to try and run all of ace inside my custom evaluator
// Runtime.evaluate is a real one, so that's a big sink
// Then obviously anything I can build or assemble as plain
// text for deployment will also have evaluate.
// These things can be dependency injected to run in a worker
// or backend/frontend plugin or even a hack to communicate 
// with browser caching for offline content.
// Lots of ways to run a process, abstraction makes it more reliable?


function doConsole(...args) {
	console.log(args)
	sendMessage({
    console: args.map(a => doProperty(a)).join ('\n') 
  })
}

function onConsole(message) {
  console.log(message.console)
  showConsole(message.console, message.line) // exercising least privilage
}

function doProperty() {

}

let oldRunTimer

// starts a thread
function doRun(runContext) {
  let env = createEnvironment(runContext)
  let ctx = createRunContext(env)
  let AST
  try {
		AST = acorn.parse(
			'(function () {\n' + runContext.script + '\n})()\n'
			, {ecmaVersion: 2020, locations: true, onComment: []})
	} catch (e) {
		// return parser errors right away
    doError(e)
		runContext.ended = true
		return
	}
  ctx.body = AST.body[0].expression.callee.body
  ctx.bubbleTime = Date.now()
  console.log('script:', runContext.script)
  let result
  try {
		if(!oldRunTimer) {
			oldRunTimer = setInterval(pruneOldRuns, 1000)
		}
		ctx.bubbleStack[ctx.bubbleStack.length-1][1] = '<eval>'
    result = runStatement(0, [ctx.body], ctx)
  } catch (e) {
    doError(e)
		runContext.ended = true
    return
  }
  if(ctx.ended) {
		sendMessage({
			stopped: result + ''
		})
	} else if (ctx.async) {
		sendMessage({ 
			async: getThreads()
		})
	} else {
		sendMessage({ 
			result: result + ''
		})
	}
	return result
}

function onRun() {

}

function createEnvironment(runContext) {
  let declarations = {
    // include our own API so we can use it from code elsewhere
    runBody: runBody,
    doRun: doRun,
    doConsole: doConsole,
    doProperty: doProperty,
		createEnvironment: createEnvironment,
		createRunContext: createRunContext,
		// OMG, if I copy this context theres all kinds of weird things I can do to the process
  }
	if(typeof runContext.localDeclarations == 'undefined') {
		runContext.localDeclarations = []
	}
	runContext.localDeclarations.push(declarations)
	return runContext
}


function createRunContext(env) {
	Object.assign(env, {
		timers: {},
		//bubbleStack: [['inline func 0', '<eval>', 0]],
		bubbleLine: -1,
		bubbleColumn: 0,
		localVariables: getLocals(env),
		asyncRunners: 0,
		async: false,
		ended: false,
		paused: false,
		continue: false,  // TODO: implement continuations / long jumps for debugger
		// I think by pushing runStatement(AST[i]) <- i onto a stack and restoring for()?
		// TODO: continuations, check for anonymous functions, variable/function declarations
		// TODO: allow moving cursor to any symbol using address of symbol in AST
		// OR: WAIT IN STILLRUNNING() FOR UNPAUSE
	})
	return env
}


function doError(err) {
	try {
		console.log('line: ' + (currentContext.bubbleLine - 1), err)
		sendMessage({ 
			error: err.message + '',
			// always subtract 1 because code is wrapping in a 1-line function above
			line: currentContext.bubbleLine - 1,
			file: currentContext.bubbleFile,
			stack: currentContext.bubbleStack,
			// LOOK AT THIS FANCY SHIT GOOGLE CHROME DEBUGGER!
			//   MAKE A LIST OF ASSIGNMENTS NEARBY AND SEND THEIR CURRENT VALUE TO THE FRONTEND
			//   TO SAVE THE DEVELOPER TIME RERUNNING THEIR WHOLE PROGRAM JUST TO SET UP A BREAK
			//   POINT, JUST TO CHECK THE VALUE OF A LOOSELY TYPED VARIABLE. SEE THAT? LOOSE
			//   TYPING WORKS JUST FINE IF YOUR TOOLS SUPPORT YOU INSTEAD OF WORKING AGAINST YOU
			// SEE, IT'S A CATCH22, WHY WOULD I SPIN MY WHEELS FIXING CHROME DEBUGGER'S SOURCE CODE
			//   WHEN THE EXPECTATION IS THAT IF I DON'T LIKE IT, I CAN FIX IT MYSELF. THAT'S WHY
			//   IT SUCKS STILL. THE WHOLE "OPEN SOURCE DOESN'T OWE YOU ANYTHING", IS A SELF 
			//   DEFEATING PRINCINPAL, LIKE IF ALL THE AMERICAN FARMERS DECIDED TO LET PEOPLE STARVE
			//                                         (HUNGRY? FIX THE TRACTOR YOURSELF)
			//   THEY DON'T OWE YOU ANYTHING, NOT EVEN LIFE SUPPORT. FUCK OFF FOSS, FOSS OWES ME
			//   EVERYTHING BECAUSE I'LL BE THE ONE STUCK CLEANING THIS SHIT CODE UP.
			//   TECHNICAL DEBT APPLIES TO PUBLISHING INCORRECT CODE ALSO. CODE IS LIKE LITTER.
		})
	} catch (e) {
		if(!e.message.includes('context invalidated')) {
			throw e
		}
	}
}


function onError(error) {
  // TODO: some generic reporting?
  console.log(error)
  showError(error)
}


// access info from another remote, or another context
//   used to lookup library functions, inject scripts 
//   into other pages
function doAccessor(member) { // shouldn't need senderId with DI
	let memberName = member.object.name + '.' + member.property.name
	// YOU SEE? THIS IS WHY I REWRITE STUFF
	console.log(memberName)
	let response = sendMessage({
		accessor: memberName
	})
	if (!response || typeof response.fail != 'undefined') {
		throw new Error('Member access error: ' + memberName)
	}
	if(typeof response.library != 'undefined') {
		return doRun(response.library)
	} else
	if(typeof response.function != 'undefined') {
		// TODO: add paramerters
		return doAccessor.bind(this, member)
	} else
	if(typeof response.json != 'undefined') {
		return JSON.parse(response.json) // window.location, not volatile objects
	} else
	if(typeof response.value != 'undefined') {
		return response.value // primitive types
	}
}


let temporarySessionEncryptor

function onAccessor(request) {
	if(request.sessionId) {
		(function (sess) {
			temporarySessionEncryptor = function (data) {
				return crypt(sess, data)
			}
		})(request.sessionId)
	}
	// INTERESTING, REALIZING THIS IS THE ONLY ABSTRACTION REPL CAN
	//   DO BY ITSELF, WINDOW.LOCATION LOOKUPS ARE CONTEXT DEPENDENT
	if(typeof request.accessor != 'undefined'
		&& request.accessor.startsWith('exports.')) {
		return doLibraryLookup(request.accessor.split('.')[1])
	}
}


function doLibraryLookup(functionName) {
	let libraryFiles = Object.keys(FS.virtual)
		.filter(function (p) { return p.includes('/library/') })
	for(let i = 0; i < libraryFiles.length; i++) {
		let libraryCode = Array.from(FS.virtual[libraryFiles[i]].contents)
			.map(function (c) { return String.fromCharCode(c) })
			.join('')
		// TODO: make these tokens instead of function for cross language support
		if(libraryCode.includes('function ' + functionName)) {
			return {
				library: libraryCode,
				name: libraryFiles[i],
				// TODO: a hash value?
			}
		} else {
			let currentSession = window.ace.getValue()
			if (currentSession.includes('function ' + functionName)) {
				return {
					library: currentSession,
					name: '<eval>',
					// TODO: a hash value?
				}
			}
		}
	}
}


let threads = {}

// SINK
function getThreads() {
	return JSON.stringify(Object.keys(threads)
		.map(function (runId) {
			return [
				runId[0] + '******' + runId[runId.length-1],
				threads[runId].bubbleTime
			]
		}))
}

const THREAD_SAVE_TIME = 3 * 1000 // * 60

function pruneOldRuns() {
	// i just thought maybe a transpiler converted code to var which changes scope and
	//   could make it vulnerable?
	let runIds = Object.keys(threads)
	for(let i = 0; i < runIds.length; i++) {
		let senderId = threads[runIds[i]].senderId
		if(threads[runIds[i]].ended
			&& Date.now() - threads[runIds[i]].bubbleTime > THREAD_SAVE_TIME) {
			delete threads[runIds[i]]
			doStatus({ senderId: senderId }, false)
		}
	}
	if(Object.keys(threads).length == 0) {
		clearInterval(oldRunTimer)
		oldRunTimer = null
	}
}


async function doStatus(doSleep) {
	if(typeof currentContext == 'undefined') {
		return
	}
	try {
		let statusUpdate = { 
			// always subtract 1 because code is wrapping in a 1-line function above
			line: currentContext.bubbleLine - 1,
			stack: currentContext.bubbleStack,
			file: currentContext.bubbleFile,
		}
		if(currentContext.ended) {
			statusUpdate.stopped = getThreads()
		} else if (currentContext.paused) {
			statusUpdate.paused = getThreads()
		} else {
			statusUpdate.status = getThreads()
		}
		sendMessage(statusUpdate);
		//console.log(currentContext.bubbleLine)
		// don't sleep on library functions
		if(doSleep && currentContext.bubbleFile == '<eval>') {
			console.log('DELAYING! ' + currentContext.bubbleLine)
			await new Promise(resolve => setTimeout(resolve, DEFAULT_SHORT_DELAY))
		}
	} catch (e) {
		if(e.message.includes('context invalidated')) {
			// ignore, happens on refresh sometimes
		} else {

		}
	}
}

function getLocals(ctx) {
	let result = ctx.localVariables
	if(typeof ctx.localDeclarations == 'undefined') {
		return {}
	}
	for(let i = 0; i < ctx.localDeclarations.length; i++) {
		let localCtx = ctx.localDeclarations[i]
		let localVariables = Object.keys(localCtx)
		for(let l = 0; l < localVariables.length; l++) {
			result[localVariables[l]] = typeof localCtx[localVariables[l]]
		}
		let localProperties = Object.getOwnPropertyNames(localCtx)
		for(let k = 0; k < localProperties.length; k++) {
			result[localProperties[k]] = typeof localCtx[localProperties[k]]
		}
		let parentObject = Object.getPrototypeOf(localCtx)
		while(parentObject.constructor !== Object
			&& parentObject.constructor !== Array) {
			let localProperties = Object.getOwnPropertyNames(parentObject)
			for(let j = 0; j < localProperties.length; j++) {
				result[localProperties[j]] = typeof localCtx[localProperties[j]]
			}
			parentObject = Object.getPrototypeOf(parentObject)
		}
	}
	return result
}


async function doBootstrap(script, globalContext) {
	let bootstrapRunContext = {
		ended: false,
		stopped: false,
		paused: false,
		returned: false,
		senderId: 0, // always comes from frontend?
		bubbleStack: [['inline func 0', 'library/repl.js', 0]],
		localVariables: {
			module: 'object',
			Object: 'function',
			Array: 'function',
			console: 'object',
		},
		localDeclarations: [{
			module: WEBDRIVER_API,
			Object: Object,
			Array: Array,
			Promise: Promise,
			console: console,
		}],
	}
	bootstrapRunContext.localDeclarations[0].currentContext = bootstrapRunContext
	bootstrapRunContext.localVariables.currentContext = 'object'

	let replLibrary = Array.from(FS.virtual['library/repl.js'].contents)
			.map(function (c) { return String.fromCharCode(c) }).join('')
	try {
		let AST = acorn.parse(
			'(function () {\n' + replLibrary + '\nreturn doRun;})()\n'
			, {ecmaVersion: 2020, locations: true, onComment: []})
		bootstrapRunContext.script = replLibrary
		await runStatement(0, 
				[AST.body[0].expression.callee.body], bootstrapRunContext)
		bootstrapRunContext.returned = false
		delete bootstrapRunContext.bubbleReturn
		Object.assign(globalContext, bootstrapRunContext.localDeclarations[0])
	} catch (e) {
		console.log(e)
	}

	bootstrapRunContext.localDeclarations.unshift(globalContext)
	bootstrapRunContext.localVariables = await getLocals(bootstrapRunContext)
	bootstrapRunContext.returned = false
	delete bootstrapRunContext.bubbleReturn
	if(typeof doRun != 'undefined') {
		try {
			bootstrapRunContext.script = script
			bootstrapRunContext.bubbleFile = '<eval>'
			bootstrapRunContext.bubbleStack.push(['inline func 0', '<eval>', 0])
			let result = await doRun(bootstrapRunContext) // NOW IT'S RECURSIVE
			//sendMessage({
			//	result: result
			//})
			bootstrapRunContext.returned = false
			return result
		} catch (e) {
			console.error(e)
		}
	} else {
		throw new Error('Bootstrap failed!')
	}
}


 // BOOTSTRAP CODE?
 if(typeof module != 'undefined') {
	module.exports = {
		onAccessor,
		doLibraryLookup,
		doAccessor,
		doBootstrap,
	}
}


