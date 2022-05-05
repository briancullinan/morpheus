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
	if(typeof runContext.localDeclarations == 'undefined') {
		debugger
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
		sendMessage({ 
			error: err.message + '',
			// always subtract 1 because code is wrapping in a 1-line function above
			line: currentContext.bubbleLine - 1,
			file: currentContext.bubbleStack[currentContext.bubbleStack.length-1][1],
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


async function onAccessor(response) {

	// convert response to compatible output
	if(typeof response != 'object' || !response) {
		let value = response
		let type = typeof value
		if(type == 'function') {
			value = value + ''
		} else if (type == 'object') {
			type = 'json'
			value = JSON.stringify(Object.assign({
				_accessor: true
			}, value || {}))
		} else {
			value = JSON.stringify(value)
		}
		let result = {
			responseId: response.responseId,
			type: type,
		}
		result[type] = value
		return value

	} else 

	if(typeof response.library != 'undefined') {
		try {
			let AST = acorn.parse(
				'(function () {\n' + response.library + '\nreturn ' + response.name + ';\n})()\n'
				, {ecmaVersion: 2020, locations: true, onComment: []})
			currentContext.script = response.library
			currentContext.bubbleFile = response.file
			currentContext.bubbleStack.push(['inline func 0', response.file || '<eval>', 0])
			await runStatement(0, 
					[AST.body[0].expression.callee.body], currentContext)
					currentContext.returned = false
			delete currentContext.bubbleReturn
			let result = await runPrimitive({
				type: 'Identifier',
				name: response.name,
			}, currentContext)
			currentContext.returned = false
			return result
		} catch (up) {
			console.log(up)
			throw up
		}
		return
	} 

}


// access info from another remote, or another context
//   used to lookup library functions, inject scripts 
//   into other pages
async function doAccessor(response) { // shouldn't need senderId with DI
	
	if (!response || typeof response.fail != 'undefined') {
		console.log(response)
		throw new Error('Member access error: ', response)
	} else 

	if(typeof response.object != 'undefined') {
		let memberName = response.object.name + '.' + response.property.name
		response =  await sendMessage({
			accessor: memberName
		})
		// TODO: return doAccessor(memberAccess) ? convert string func to RPC
	}
	

	if(typeof response.function != 'undefined') {
		if(response.value) {
			return response.value
		} else {
			response.value = (async function (request, ...params) {
				// TODO: add paramerters
				let result = await sendMessage({
					script: '\nreturn ' + response.name + '();\n'
				})
				return result
			}).bind(this, response)
			return response
		}
	} else

	// INTERESTING, REALIZING THIS IS THE ONLY ABSTRACTION REPL CAN
	//   DO BY ITSELF, WINDOW.LOCATION LOOKUPS ARE CONTEXT DEPENDENT
	if(typeof response.accessor != 'undefined') {
		debugger
		return await doLibraryLookup(response.accessor)
	} else


	if(typeof response.json != 'undefined') {
		return JSON.parse(response.json) // window.location, not volatile objects
	} else

	if(typeof response._accessor != 'undefined') {
		response._accessor = async function (i, left, right, ctx) {
			let prop = ctx.bubbleProperty
			ctx.bubbleProperty = ''
			if(left && left[0] 
				&& left[0].type == 'AssignmentExpression') {
				return await await sendMessage({
					script: prop + ' = JSON.parse(\'' + JSON.stringify(right) + '\');'
				})
			} else {
				return await await sendMessage({
					script: 'return ' + prop
				})
			}
		}
		return response
	} else
	if(typeof response.value != 'undefined'
		|| typeof response.type != 'undefined') {
		return response.value // primitive types
	} else {
		debugger
		throw new Error('Unknown command: ', response)
	}

	// TODO: establish standard jupyter-meta-kernel connection
	

	// TODO: pre-configure proxy-networking like the engine does, frontend


	// TODO: any system-level/process-level service monitoring, call-out



}



function doLibraryLookup(functionName) {
	let libraryFiles = Object.keys(FS.virtual)
	for(let i = 0; i < libraryFiles.length; i++) {
		if(!libraryFiles[i].startsWith('library/')) {
			continue
		}
		let libraryCode = Array.from(FS.virtual[libraryFiles[i]].contents)
			.map(function (c) { return String.fromCharCode(c) })
			.join('')
		// TODO: make these tokens instead of function for cross language support
		if(libraryCode.match(new RegExp(
				'function\\s' + functionName + '.*?\\{'))) {
			return {
				// TODO: responseId
				library: libraryCode,
				name: functionName,
				file: libraryFiles[i],
				// TODO: a hash value? code signing?
			}
		} /* else {
			let currentSession = window.ace.getValue()
			if (currentSession.includes('function ' + functionName)) {
				return {
					library: currentSession,
					name: '<eval>',
					// TODO: a hash value?
				}
			}
		} */ // CODE REVIEW, this is why we need different contexts, for Live editing
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
			file: currentContext.bubbleStack[currentContext.bubbleStack.length-1][1],
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

	if(typeof doRun == 'undefined') {
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
			bootstrapRunContext.returned = false
			if(bootstrapRunContext.ended) {
				return { // ahhh same as somewhere else in doAccessor
					stopped: result,
				}
			} else if (bootstrapRunContext.async) {
				return { 
					async: getThreads(),
				}
			} else {
				return { 
					result: result,
				}
			}
		} catch (e) {
			console.error(e)
		}
	} else {
		throw new Error('Bootstrap failed!')
	}
}


async function onFrontend(replyFunction, request) {
	if(!request) {
		// no error because backend times out
		return
	} else

	if(request.status) {
		if(typeof ACE != 'undefined') {
			ACE.bubbleFile = request.file
		}
		// future coding?
		if(typeof onStatus != 'undefined') {
			return onStatus(request)
		}
	} else

	if(typeof request.script != 'undefined') {
		setTimeout(function () {
		// repl dom stuff? probably not
		try {
			let value = eval('(function (){\n' + request.script + '\n})()')
			let type = typeof value
			if(type == 'function') {
				value = value + ''
			} else if (type == 'object') {
				type = 'json'
				value = JSON.stringify(Object.assign({
					_accessor: true
				}, value || {}))
			} else {
				value = JSON.stringify(value)
			}
			let result = {
				responseId: request.responseId,
				name: request.name,
				type: type,
			}
			result[type] = value
			return replyFunction(result)
		} catch (e) {
			console.log(e)
			replyFunction({
				responseId: request.responseId,
				fail: e.message,
			})
		}
		}, 200)
	} else

	if(typeof request.accessor != 'undefined'
			&& typeof onAccessor != 'undefined') {
		// TODO: incase we need REPL on frontend because of CSP
		let lib = onAccessor(request)
		return replyFunction(lib)
	} else

	// WHAT IF URLS WERE XPATHS TO FUNCTIONS? AND ROUTING TABLES WHERE JUST FUNCTIONS?
	if(typeof request.accessor != 'undefined') {
		// TODO: re-forward back to the backend accessor because
		//   worker shares a local storage, this is what
		//   I meant by "ask language server". No matter if
		//   a request comes from more or engine or worker
		//   or plugin, it all leads back to my code in IDBFS
		// TODO: need to include installAsync here also, but only
		//   for worker interface because plugin is event/reply based
		//if(replyFunction === SYS.worker.postMessage) {
		let value
		let name = request.accessor.split('.')[1]
		let type = typeof window[name]
		if(type == 'function') {
			value = window[name] + ''
		} else if (type == 'object') {
			type = 'json'
			value = JSON.stringify(Object.assign({
				_accessor: true
			}, window[name] || {}))
		} else {
			value = JSON.stringify(window[name])
		}
		let result = {
			responseId: request.responseId,
			type: type,
			name: name
		}
		result[type] = value
		return replyFunction(result)
	} else 

	// combine with repl.js doAccessor
	// result means they asked for it?
	if(typeof request.result != 'undefined') {
		return request.result
	} else 

	if(typeof doDialog != 'undefined'
			&& typeof request.accessor != 'undefined') { // REPL?
		let dialog = doDialog(request, replyFunction)
		return dialog
	}

	// TODO: fold frontend and onAccessor into each other based on request type 
	//   should be able to have a specific direction for when to encode result
	//   or when to return real result to REPL, like the opposite of the member.object
	//   access thing
	if(typeof doRun != 'undefined') {
		doRun(request.accessor || request.script, {
			window: window,
			ACE: ACE,
		}) // NOW IT'S RECURSIVE
	}
}


 // BOOTSTRAP CODE?
 if(typeof module != 'undefined') {
	module.exports = {
		doAccessor,
		doBootstrap,
		doLibraryLookup,
		onFrontend,
		
	}
}


