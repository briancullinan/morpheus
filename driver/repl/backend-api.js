// TODO: NOT ENTIRELY SURE WHAT TO EXPOSE HERE
//   SO KEEP IT LIMITED FOR NOW   ;)

// OH NO! I WENT TO FAR! I CAN RUN CODE FROM FRONT TO BACK
//   AND BACK TO FRONT!
function _makeLibraryAccessor(callArgs, runContext) {
	runContext.localVariables.module.exports._accessor 
		= runContext.localVariables.thisWindow._accessor
	// also get a list of library functions
	runContext.localVariables.module._accessor 
		= runContext.localVariables.thisWindow._accessor
}



function createLibrary(response, member, runContext) {
	let previousScript = runContext.script // SO IT CAN PARSE ATTRIBUTES, 
	try {
		// TODO: extract static functionality and convert to C# style static initializer
		//   that way, in the future, I can do the same thing to game code for static-build.
		let libraryAST = acorn.parse(
			'(function () {\n' + response.library + '\n})()\n'
			, {ecmaVersion: 2020, locations: true, onComment: function () {
				// TODO: this would be better for keeping track of @Attributes
			}})
		let newLibrary = libraryAST.body[0].expression.callee.body.body
		//   TODO: MAKE WORK ON INTERNAL FUNCTIONS, ASSIGN TO CONEXT??
		runContext.script = response.library
		for(let i = 0; i < newLibrary.length; i++) {
			if(newLibrary[i].type == 'FunctionDeclaration'
				&& newLibrary[i].id) {
					let newFunction = runFunction(newLibrary[i], runContext)
					newFunction.filename = response.name
					WEBDRIVER_API[newLibrary[i].id.name] = newFunction
			}
		}
	} catch (e) {
		debugger
		console.log('WARNING: ' + e.message)
	} finally {
		runContext.script = previousScript
	}
	if(WEBDRIVER_API.hasOwnProperty(member.property.name)) {
		return WEBDRIVER_API[member.property.name]
	}
}



async function _doAccessor(member, runContext, senderId) {
	if(!member.object.name || !member.property.name
	//	|| member.object.name != 'window' /* no safety? */
	) {
		throw new Error('MemberExpression: Not implemented!')
	}
	// TODO: call tree? multiple level? 
	let memberName = member.object.name + '.' + member.property.name
	let expression
	switch(memberName) {
		// safe to share?
		case 'window.screenLeft':
		case 'window.screenTop':
		case 'window.outerHeight':
		case 'window.outerWidth':
			expression = memberName
			break
		case 'window.location':
			expression = '(\'data:application/json;utf-8,\'+JSON.stringify(window.location))'
			break
		case 'document.cookie':
			expression = 'document.cookie'
			break
		case 'window.localStorage':
			expression = 'Array(window.localStorage.length).fill().map(function (i) { return window.localStorage.key(i) })'
			break
		default:
			
	}
	let response
	// TODO: attach encrypter to every page for forms transmissions
	if(expression) {
		response = await chrome.debugger.sendCommand({
			tabId: senderId
		}, 'Runtime.evaluate', {
			expression: expression
		})
	} else {
		response = await chrome.tabs.sendMessage(senderId, {
			accessor: memberName
		})
	}
	if (typeof response.fail != 'undefined') {
		throw new Error('Member access error: ' + memberName)
	}

	if(memberName == 'window.localStorage') {
		debugger
		_makeLocalStorage()
	} else
	if (typeof response.library != 'undefined') {
		return createLibrary(response, member, runContext)
	} else 
	if (typeof response.result.object != 'undefined') {
		// TODO: add an _accessor to Objects?
		debugger
	} else 
	if (typeof response.result.value != 'undefined') {
		if(response.result.type == 'string'
			&& response.result.value.startsWith('data:')) {
			let isJSON = response.result.value.split(';')
			if(isJSON.length > 1 && isJSON[0].endsWith('application/json')) {
				let firstLine = isJSON[1].split(',').slice(1).join(',')
				return JSON.parse(firstLine + isJSON.slice(2).join(';'))
			}
		}
		return response.result.value
	} else {
		return response.result
	}
}


// this _accessor template is getting pretty big, TODO: combine with above but differentiate eval versus ask
function _makeWindowAccessor(result, runContext) {
	if(typeof result != 'object' || !result) {
		return result
	}
	result._accessor = async function (i, member, AST, ctx, callback) {
		return await _doAccessor({
			// polyfill to window name since we know it's a window type
			object: { name: 'window' },
			property: { name: member.property.name },
		}, ctx, ctx.localVariables.tabId)
	}
	return result
}


// WHY DO THIS? Because setTimeout bubbles up, we don't want run context to continue
// THIS WILL HELP WHEN IMPLEMENTING @Before, @After, @Done to see if end action
//  should evaluate yet
function _setTimeout(runContext, callback, msec) {
	runContext.async = true
	runContext.asyncRunners++
	let timerId
	timerId = setTimeout(function () {
		runContext.asyncRunners--
		delete runContext.timers[timerId] // keep track if timer triggers before it's counted
		callback()
	}, msec)
	runContext.timers[timerId] = false // reoccuring
	return timerId
}



function _setInterval(runContext, callback, msec) {
	runContext.async = true
	runContext.asyncRunners++
	let timerId = setInterval(function () {
		callback()
	}, msec)
	runContext.timers[timerId] = true // reoccuring
	return timerId
}



function _clearTimeout(runContext, id) {
	// keep track if timer triggers before it's counted
	if(typeof runContext.timers[id] != 'undefined') {
		runContext.asyncRunners--
		delete runContext.timers[id]
	}
	return clearInterval(id)
}



function _clearInterval(runContext, id) {
	runContext.asyncRunners-- // always subtracts because it was reoccurring
	return clearInterval(id)
}

// ChromeDriver does this inside the browser context, but because
//   Our runner is interpreted we don't need to override browser promise
//   This also prevents ChromeDriver from fucking up out Promise object,
//      in-case javascript is checking for a promise type in the application.
// TODO: _Promise counter to detect when process is off, for async:
function _Promise(runContext, resolve) {

}

async function createRunContext(runContext, env) {
	Object.assign(runContext, {
		timers: {},
		bubbleStack: [],
		bubbleLine: -1,
		bubbleFile: '<eval>',
		bubbleColumn: 0,
		localVariables: env,
		localFunctions: {},
		asyncRunners: 0,
		async: false,
		ended: false,
		paused: false,
		continue: false, // TODO: implement continuations / long jumps for debugger
		// I think by pushing runStatement(AST[i]) <- i onto a stack and restoring for()?
		// TODO: continuations, check for anonymous functions, variable/function declarations
		// TODO: allow moving cursor to any symbol using address of symbol in AST
		// OR: WAIT IN STILLRUNNING() FOR UNPAUSE
	})
	return runContext
}


async function createEnvironment(runContext) {
	// TODO: this is where we add Chrome security model,
	//    this they decided "IT'S TOO DANGEROUS"
	// A nice design was never explored.
	let thisWindow = {
		_accessor: async function (i, member, AST, ctx, callback) {
			return await _doAccessor(member, ctx, ctx.senderId)
		}
	}
	let env = {
		thisWindow: thisWindow,
		window: thisWindow,
		tabId: runContext.senderId,
		Math: Math,
		// TODO: micro-manage garbage collection?
		Object: Object,
		// snoop on timers so REPL can report async results
		Error: Error,
		setTimeout: _setTimeout.bind(null, runContext),
		setInterval: _setInterval.bind(null, runContext),
		Promise: _Promise.bind(null, runContext), // TODO: bind promise to something like chromedriver does
		doMorpheusKey: doMorpheusKey,
		doMorpheusPass: doMorpheusPass,
		clearTimeout: _clearTimeout.bind(null, runContext),
		clearInterval: _clearInterval.bind(null, runContext),
		_makeWindowAccessor: _makeWindowAccessor,
		_makeLibraryAccessor: _makeLibraryAccessor,
		networkSettled: _networkSettled,
		attachDebugger: attachDebugger,
		navigationURL: null,
		module: WEBDRIVER_API,

		// google extension-style API calls
		chrome: {
			tabs: {
				get: chrome.tabs.get,
				// GOOGLE COLLAB IS COOL AND ALL, BUT IT'S
				//   NOT LIKE I CAN EDIT COLLAB SOURCE CODE
				//   AND HACK MY OWN SHARED UI LIKE I CAN HERE \/
				sendMessage: _sendMessage,
			},
			debugger: {
				getTargets: chrome.debugger.getTargets,
				sendCommand: _sendCommand,
			},
			windows: {
				get: chrome.windows.get,
				update: chrome.windows.update,
				create: _createWindow, // snoop on navigation url
			},
			profiles: {
				list: function () { return morphKey }
			},
		},
		console: {
			log: doConsole.bind(console, runContext.senderId)
		},

	}
	if(typeof initBrowser != 'undefined') {
		env.initBrowser = initBrowser
	}
	// TODO: import a bunch of quake 3 functions automatically
	// TODO: return as "function" type to backend, and treat like RPC
	if(typeof Sys_exec != 'undefined') {
		env.Sys_exec = Sys_exec
	}
	return env
}


async function attachDebugger(tabId, initial) {
	// ERROR: Refused to evaluate a string as JavaScript because 'unsafe-eval'
	// ^- That's where most people give up, but I'll write an interpreter
	try {
    await chrome.debugger.attach({tabId: tabId}, '1.3')
    // confirm it works
    let dom = await chrome.debugger.sendCommand({
      tabId: tabId
    }, 'DOM.getDocument')
    if(dom.root.children[1] && !initial) {
      return
    }
    let running = true
    if(initial) {
      let body = dom.root.children[1].children[1]
      running = !!body.attributes[1].includes('running')
    }
    // doesn't have a root node or is initial and not running
    if(!initial || !running) {
      chrome.tabs.sendMessage(tabId, { 
        warning: 'Tab not running.' 
      }, function(response) {

      });
    }
  } catch (e) {
    if(e.message.includes('Another debugger')) {
      // TODO: attach to another tab!
    } else
    throw new Error('Protocol error: attachDebugger')
  }

}

  

async function _createWindow(options) {
	// snoop on navigation url
	// FOR CODE REVIEWS, THIS LEAF TRIPPED ME UP BECAUSE I MOVED NAVIGATION URL TO THE API
	//   NOT SURE THERE IS ENOUGH LINKING HERE THAT EVEN A SYNTAX CHECKER WOULD FIND THAT,
	//   UNLESS THERE WAS SOME SORT OF GLOBAL "DID YOU MEAN?"
	currentContext.localVariables.navigationURL = options.url
	let win = await chrome.windows.create(options)
	currentContext.localVariables.tabId = win.tabs[0].id
	//attachRequestHandlers(win.tabs[0].id, win.id)
	await _networkSettled()
	return win
}

const MAX_SETTLED = 10000
const MAX_SIMULTANEOUS = 3

async function _networkSettled() {
	let start = Date.now()
	let url = currentContext.localVariables.navigationURL
	currentContext.networkStarted = false
	let result = await new Promise(function (resolve, reject) {
		let networkTimer
		networkTimer = setInterval(function () {
			if(Date.now() - start > MAX_SETTLED) {
				clearInterval(networkTimer)
				reject(new Error('Navigation failed.'))
			} else if (currentContext.queueRate 
				&& currentContext.networkStarted
				&& currentContext.queueRate.length <= MAX_SIMULTANEOUS) {
				clearInterval(networkTimer)
				resolve(url)
			} else if (currentContext.queueRate) {
				let nowish = currentContext.queueRate.shift()
				if(Date.now() - nowish < 1000) {
					currentContext.queueRate.unshift(nowish)
				}			
			}
			// TODO: double check the original request even made it load?
			//   CAS and ISP DNS changes will ruin this.
			//   Will have to account for that at a higher level.
		}, 100)
	})
	return result
}

async function _sendMessage(message) {
	// allow the library script to send messages 
	//   back to frontend
	if(Object.keys(message).length == 0) {
		throw new Error('Message is empty.')
	}
	addSessionIdFunction(message)
	return await chrome.tabs.sendMessage(currentContext.senderId, message)
}

async function _sendCommand(command, options) {
	if(!currentContext) {
		throw new Error('Tab context not set.')
	}
	// allow the library script to send messages 
	//   back to frontend
//	}, 'Debugger.evaluateOnCallFrame', {
	let tabId = currentContext.localVariables.tabId
	return await chrome.debugger.sendCommand({
		tabId: tabId
	}, command, options)
}





