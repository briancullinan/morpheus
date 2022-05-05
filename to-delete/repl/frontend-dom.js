// I HAVE TO REFOLD, THIS IS GETTING TOO COMPLICATED


function runAccessor() {
	// TODO: some error checking?
	return false
}


function doStatus(request) {
	if(!ACE.statusWidgets) {
		ACE.statusWidgets = []
	}
	if(request.status) {
		ACE.threadPool = JSON.parse(request.status)
	}
	// https://www.youtube.com/watch?v=tvguv-lvq3k - Bassnectar - The Matrix (ft. D.U.S.T.)
	// TODO: put another instance of ACE in the status widget
	let previousCall
	if(request.stack
		&& (previousCall = request.stack.pop())) {
		let previousFunction = previousCall.split('.')[0].trim()
		if(!ACE.libraryFunctions) {
			ACE.libraryFunctions = {}
		}
		if(typeof ACE.libraryFunctions[previousFunction] != 'undefined') {
		} else {
			ACE.libraryFunctions[previousFunction] = doLibraryLookup(previousFunction)
		}
		// in-case null means we already searched doLibraryLookup
		// FOR CODE REVIEWS, HOW TO MEASURE PERFORMANCE GAINS BY NOT
		//   REPEATING TASKS JUST FROM LOOKING AT CODE WITH LITTLE UNDERSTANDING?
		if(ACE.libraryFunctions[previousFunction]) {
			// slowly open function without affecting scroll
			if(ACE.libraryFunctions[previousFunction].name == '<eval>') {	
				ACE.statusWidgets[request.line] = Date.now()
				ACE.previousNonLibrary = request.line
			} else {
				ACE.previousLine = request.line || 0
			}
		}
		if(request.stack
			&& (!ACE.callStack 
				|| ACE.callStack.length != request.stack.length)) {
			ACE.callStack = request.stack
		}
	}

	if(!ACE.filestimer) {
		ACE.filestimer = setTimeout(updateFilelist, 100)
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


function onFrontend(request, reply) {
	document.body.classList.add('starting')
	reply({
		responseId: request.responseId
	})
	ACE.downloaded = true
}

function onStarted(request) {
	document.body.classList.remove('stopped')
	document.body.classList.remove('paused')
	document.body.classList.remove('starting')
	document.body.classList.add('running')
	window['run-button'].classList.remove('running')
	if(request.started) {
		ACE.threadPool = JSON.parse(request.started)
		updateFilelist('Threads')
	}
}


function doAccessor(request, reply) {
	if(!document.body.className.includes('running')
		// because pause it allowed to happen mid flight finish the accessor request
		&& !document.body.className.includes('paused')
		// plus a side effect, we might use accessors in debugging
	) {
		//debugger
	}
	switch(request.accessor) {
		case '_morpheusKey':
			ACE.dropFile = doDialog(request, ACE.dropFile, reply)
		return
		case '_enterLogin':
			ACE.enterPassword = doDialog(request, ACE.enterPassword, reply)
		return
		default:
			if(request.accessor.startsWith('exports.')) {
				// TODO: this is where we ask the Language-Server which file 
				//   the symbol is in and figure out if it needs to be translated.
				// for now though, just check driver/library/index.js
				let lib = 
				if(lib) {
					lib.responseId = request.responseId
				} else {
					lib = {
						responseId: request.responseId
					}
				}
				reply(lib)
				return
			}
		debugger
	}
}




// this is potentially replaced with every page change with an encryption
//   key that is not known to the backend, for collecting a system password
//   the backend generates a temporary key and stores it in a functional
//   context like this one
// while none of this prevents plugins from snooping on passwords, 
//   i'm hoping it prevents logging systems from snooping, or other plugins
//   from snooping on all page messages
// ENCRYPT WITH THE SESSIONID! BECAUSE WE HAVE PREVENTED RUNIDS/SESSIONIDS FROM BEING
//   SENT BACK TO THE CLIENT, 1-WAY FROM FRONTEND-PLUGIN.JS TO BACKEND-PLUGIN.JS
// SESSIONID IS CREATED IN THE CONTEXT OF A SECONDARY/REMOTE BROWSER WINDOW.
//   NEVER STORED IN FRONTEND-PLUGIN.JS, FOR TRANSFERRING FROM PAGE TO PAGE
//   WITHOUT THE BACKEND/SERVER EVER KNOWING THE TRUTH.


function doWorker(data) {
	sendMessage(JSON.stringify(data))
}


function doLocals(request) {
	if(typeof request.locals == 'undefined') {
		return
	}
	debugger
	
}


function onMessage(reply, message) {
  let request = message.data
	// never download if we get a response from extension
	ACE.downloaded = true
	let requestType = Object.keys(request)
		.filter(function (k) { return k != 'line' && k != 'stack' })
	if(requestType) {
		document.body.classList.add(requestType)
	}

	if(typeof request.service != 'undefined') {
		debugger
	} else 
	if(typeof request.frontend != 'undefined') {
		onFrontend(request, reply)
	} else
	if(typeof request.started != 'undefined') {
		onStarted(request)
	} else
	if(typeof request.paused != 'undefined') {
		onPaused(request)
	} else
	

	// the rest of these are console messages
	if(typeof request.warning != 'undefined') {
		debugger
	} else
	if(typeof request.download != 'undefined') {
		emitDownload(request.name, request.download, request.type)
	} else
	if(typeof request.console != 'undefined') {
		doConsole(request)
	} else 
	if(typeof request.error != 'undefined') {
		doError(request)
		doLocals(request)
	} else 
	if(typeof request.result != 'undefined') {
		doResult(request)
	} else 
	if(typeof request.async != 'undefined') {
		// async notifications are like halfway between result and started
		request.started = request.async
		onStarted(request)
	} else 
	if(typeof request.status != 'undefined') {
		doStatus(request)
	} else 
	if(typeof request.locals != 'undefined') {
		doLocals(request)
	} else 
	if(typeof request.cookie != 'undefined') {
		ACE.cookiesList = JSON.parse(request.cookie)
		updateFilelist('Cookies')
	} else 
	if(typeof request.stopped != 'undefined') {
		document.body.classList.remove('paused')
		document.body.classList.remove('running')
		document.body.classList.remove('starting')

	} else {
		console.error('Unrecognized request: ', request)
	}
}


function doPlugin(data) {
	window['run-script'].value = JSON.stringify(data)
	window['run-accessor'].click()
}

/*
navigator.serviceWorker.register('blob:...', {
	updateUrl: '/sw.js'
})
*/
