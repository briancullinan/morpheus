// TODO: NOT ENTIRELY SURE WHAT TO EXPOSE HERE
//   SO KEEP IT LIMITED FOR NOW   ;)





function _makeWindowAccessor(result, runContext) {
	if(typeof result == 'object' && result) {
		result._accessor = async function (i, member, AST, ctx, callback) {
			if(member.property.name == 'location') {
				let location = await chrome.debugger.sendCommand({
					tabId: ctx.localVariables.tabId
				}, 'Runtime.evaluate', {
					expression: 'JSON.stringify(window.location)'
				})
				if(!location || !location.result
					|| location.result.type != 'string') {
					throw new Error('Member access error: ' + member)
				} else {
					return JSON.parse(location.result.value)
				}

			} else
			if(result.hasOwnProperty(member)
				|| result[member]) {
				return result[member]
			} else {
				throw new Error('Member access error: ' + member)
			}
		}
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

async function createEnvironment(sender, runContext) {
	// TODO: this is where we add Chrome security model,
	//    this they decided "IT'S TOO DANGEROUS"
	// A nice design was never explored.
	let thisWindow = {
		_accessor: async function (i, member, AST, ctx, callback) {
			if(!member.object.name || !member.property.name
				|| member.object.name != 'window' /* safety? */) {
				throw new Error('MemberExpression: Not implemented!')
			}
			// TODO: call tree? multiple level? 
			let memberName = member.object.name + '.' + member.property.name
			let response = await chrome.tabs.sendMessage(sender.tab.id, { accessor: memberName })
			if(typeof response.function != 'undefined') {
				debugger
				return function () {
					debugger
				}
			} else if (typeof response.object != 'undefined') {
				// TODO: add an _accessor to Objects?
				debugger
			} else if (typeof response.result != 'undefined') {
				return response.result
			} else if (typeof response.fail != 'undefined') {
				throw new Error('Member access failed: ' + member)
			} else {
				throw new Error('Couldn\'t understand response.')
			}
		},
		// window.screenLeft, window.outerHeight
	}
	let env = {
		thisWindow: thisWindow,
		window: thisWindow,
		tabId: sender.tab.id,
		chrome: {
			tabs: {
				get: chrome.tabs.get,
				// GOOGLE COLLAB IS COOL AND ALL, BUT IT'S
				//   NOT LIKE I CAN EDIT COLLAB SOURCE CODE
				//   AND HACK MY OWN SHARED UI LIKE I CAN HERE \/
				sendMessage: chrome.tabs.sendMessage
						// allow the library script to send messages 
						//   back to frontend
						.bind(chrome.tabs, sender.tab.id)
			},
			windows: {
				get: chrome.windows.get,
				create: createWindow,
			},
			profiles: {
				list: function () { return morphKey }
			},
		},
		module: WEBDRIVER_API,
		console: {
			log: doConsole.bind(console, sender.tab.id)
		},
		// TODO: micro-manage garbage collection?
		Object: Object,
		setTimeout: _setTimeout.bind(null, runContext),
		setInterval: _setInterval.bind(null, runContext),
		Promise: _Promise.bind(null, runContext), // TODO: bind promise to something like chromedriver does
		setWindowBounds: setWindowBounds,
		navigateTo: navigateTo,
		doMorpheusKey: doMorpheusKey,
		clearTimeout: _clearTimeout.bind(null, runContext),
		clearInterval: _clearInterval.bind(null, runContext),
		_makeWindowAccessor: _makeWindowAccessor,

	}
	Object.assign(runContext, {
		timers: {},
		bubbleStack: [],
		bubbleLine: -1,
		bubbleColumn: 0,
		libraryLines: 0,
		libraryLoaded: false,
		localVariables: env,
		localFunctions: {},
		senderId: sender.tab.id,
		asyncRunners: 0,
		async: false,
		ended: false,
		paused: false,
		continue: false, // TODO: implement continuations / long jumps for debugger
		// I think by pushing runStatement(AST[i]) <- i onto a stack and restoring for()?
		// TODO: continuations, check for anonymous functions, variable/function declarations
		// TODO: allow moving cursor to any symbol using address of symbol in AST
	})
}


// ERROR: Refused to evaluate a string as JavaScript because 'unsafe-eval'
// ^- That's where most people give up, but I'll write an interpreter
//let targets = await chrome.debugger.getTargets()
//if(targets.filter(t => t.attached && t.tabId == sender.tab.id).length == 0) {


async function attachDebugger(tabId, initial) {
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

  

function createWindow(options) {
	currentContext.navationURL = options.url
	return chrome.windows.create(options)
}


async function setWindowBounds(windowId, tabs, x, y, w, h) {
	try {
		/*
		let targetTabs = await chrome.tabs.query({windowId: windowId})
		if(!targetTabs) {
			throw new Error('Window closed or doesn\'t exist')
		}
		let targetId = targetTabs[0].id
		*/
		let targetId = tabs[0].id
		let targets = (await chrome.debugger.getTargets())
			.filter(t => t.tabId == targetId)
		if(targets[0] && !targets[0].attached) {
			await attachDebugger(targetId)
		}
		if(typeof x != 'undefined' && typeof y != 'undefined') {
			await chrome.windows.update(windowId, {
				left: Math.round(x),
				top: Math.round(y),
			})
		}

		if(typeof w != 'undefined' && typeof h != 'undefined') {
			await chrome.windows.update(windowId, {
				height: Math.round(h),
				width: Math.round(w),
			})
		}
		//let processId = await chrome.processes.getProcessIdForTab(targetId)

		return await chrome.windows.get(windowId)
	} catch (e) {
		debugger
		console.log(e)
		throw new Error('Protocol error: setWindowBounds(...)')
	}
}


async function navigateTo(url, wait) {
	if(!currentContext) {
		throw new Error('Tab context not set.')
	}
	let targetId = currentContext.localVariables.tabId
	let targets = (await chrome.debugger.getTargets())
		.filter(t => t.tabId == targetId)
	if(targets[0] && !targets[0].attached) {
		await attachDebugger(targetId)
	}
	currentContext.navationURL = url
	let dom = await chrome.debugger.sendCommand({
		tabId: targetId
	}, 'Runtime.evaluate', {
//	}, 'Debugger.evaluateOnCallFrame', {
		expression: 'window.location = "' + url + '";'
	})
	// TODO: wait for network to settle, or duck out
	
}



