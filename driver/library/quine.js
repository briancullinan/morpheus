// emit self in a cloud-compatible way.
// SELF EXTRACTOR LIKE BUSYBOX
// quines have a life-expectancy, we should be up-front with 
//   them about that so they don't come back to kill us like Roy.

// convert makefile to jupyter notebook for storage in collab / download.
//   does jupyter support encryption?

// THIS IS KIND OF FUNNY, FOR CODE REVEIW, I TOOK THIS CLIENT FUNCTION
//   AND MAKE IT WORK REMOTELY IN ANY WINDOW SO BOTH CLIENT AND SCRIPT
//   CAN CALL IT. MULTISOURCE FUNCTIONS AS CODE-LEAVES? FORCE DEPENDENCY 
//   INJECTION ON MODULES THAT AREN'T NECESSARILY DESIGNED FOR DI?
// TODO: MAKE IT LOOK LIKE DOWNLOAD REQUEST CAME FROM REMOTE, NOT CONTROL
//   THIS IS COOL BECAUSE THEN WHEN I RUN GET createLibrary() I CAN SEND
//   LIBRARY CODE TO ANY CLIENT WINDOW FOR COMMANDEERING.
function emitDownload(fileName, fileData, contentType) {
	//if(typeof fileData == 'string') {
	//	fileData = fileData.split('').map(function (c) { return c.charCodeAt(0) })
	//}
	//let file = FS.virtual['morph-plugin.crx'].contents

	let blob = new Blob([fileData], {type: contentType})
	let exportUrl = URL.createObjectURL(blob);
	const tempLink = document.createElement('A');
	tempLink.style.display = 'none';
	tempLink.href = exportUrl;
	tempLink.setAttribute('download', fileName);
	document.body.appendChild(tempLink);
	tempLink.click();
	URL.revokeObjectURL(exportUrl);

}


// TODO: NEARLY TO THE POINT OF EMITTING TO THE CLOUD,
//   ALSO EMIT A RELOADER EXTENSION DURING DEVELOPMENT
//   https://github.com/arikw/chrome-extensions-reloader/blob/master/background.js
// INSTALL, RELOAD OUR OWN, UNINSTALL RELOADER
//   IF I DO THIS FROM LIBRARY/ THEN IT'S RECURSIVE.


// WOW THIS IS SO WEIRD, LOOK AT HOW MANY DIFFERENT 
//   WAYS TO COMMUNICATE THE SAME STUFF, EVEN JUST WITHIN
//   THE BROWSER.

function emitPlugin() {
	// MAKE PLUGIN
}


// plugin message response code for frontend worker chrome extension
function frontendMessageResponseMiddleware() {


	// for pausing the right script
	let lastRunId = function (request) {
		return request
	}

	// replaced by this function below after the first run
	function generateRunId() {
		let runId = getRunId(20)
		return function (request) {
			request.runId = runId
			return request
		}
	}

	function sendMessage() {
		let runScriptTextarea = document.getElementById('run-script')
		if(runScriptTextarea.value.length < 1) {
			return
		}
		let responseData = JSON.parse(runScriptTextarea.value)
		if(responseData && responseData.responseId) {
			if(awaitingResponse.hasOwnProperty(responseData.responseId)) {
				awaitingResponse[responseData.responseId](responseData)
				delete awaitingResponse[responseData.responseId]
			} else {
				//throw new Error('Accessor isn\'t waiting!')
			}
		}
		
	}

	function onMessage(request) {

		// access a client variable they've shared from code
		// basic client status message
		// THIS IS PURELY FOR TECHNICALLY MATCHING CLICKS ON THE PAGE
		//   BACK UP WITH THE RIGHT PROCESS, THIS IS NOT A SECURITY THING.
		let responseEventId = getRunId(20)
		awaitingResponse[responseEventId] = 
		(function (responseTimer) {
			if(typeof request == 'object' && request) {
				request.responseId = responseEventId
			}
			// PASSTHROUGH TO DOM
			window.postMessage(request)
			return function (response) {
				clearTimeout(responseTimer)
				// runId automatically appended to upload
				chrome.runtime.sendMessage(
						lastRunId(response), 
						window.postMessage) // ROUND AND ROUND WE GO
				delete awaitingResponse[responseEventId]
			}
		})(setTimeout(function () {
			awaitingResponse[responseEventId]()
			delete awaitingResponse[responseEventId]
		}, 3000))
		
	}

	document.addEventListener('DOMContentLoaded', 
	function () {
		document.addEventListener('click', 
		function (evt) {
			if(!evt.target) {
				return true
			} else
			if(evt.target.className.includes('run-script')) {
				lastRunId = generateRunId()
				onMessage({
					accessor: 'runBlock()'
				})
			} else
			if(evt.target.className.includes('run-accessor')) {
				sendMessage() // collects run-script value and forwards to backend
			}
		})

		chrome.runtime.onMessage.addListener(
			function (request) { onMessage(request) })

		// INIT FUNCTION NEEDS TO CREATE INITIAL SCRIPT ACCESSOR
		//   SO THERE IS ALWAYS A VALID SESSION ENCRYPTOR
		onMessage({
			// make a round trip with the front-end, in case this is the tool page
			frontend: 'Worker service started\n',
		})
	})


	//self.addEventListener('install', doInstall)


}



// backend worker for chrome extension
function backendMessageResponseMiddleware() {

	// ASYNC AND AWAIT IS DUMB IN JAVASCRIPT, THERE'S ONLY 1 THREAD
	//   this entry basically converts all calls to async
	function sendMessage(data) {
		return new Promise(function (resolve) {
			chrome.tabs.sendMessage(currentContext.senderId,
					data,	onMessage.bind(this, resolve))
		})
	}

	function onMessage(replyFunction, request) {
		if(typeof request.script != 'undefined') {
			doRun(request.script, {
				sendMessage: sendMessage.bind(this, replyFunction),
				chrome: chrome,
			})
		} else
		if(typeof request.pause != undefined) {
			let runContext = threads[request.runId]
			runStatement(0, [{
				type: 'DebuggerStatement'
			}], runContext)
			sendMessage({ 
				paused: getThreads(), 
				line: runContext.bubbleLine - 1,
				stack: runContext.bubbleStack,
			})
		} else
		// getStatus becomes a backend accessor for frontend
		//   so context for call can be anything but connection
		//   is always standardized through REPL interface, like
		//   ZMQ x 10
		if((lib = onAccessor(request))) { 
			return sendMessage(lib)
		} else
		if(typeof doRun != 'undefined') {
			doRun(request.accessor, {
				sendMessage: sendMessage.bind(this, replyFunction),
				chrome: chrome,
				window: globalThis,
				global: globalThis,
			}) // NOW IT'S RECURSIVE
		}

	}

	let threads = {}

	// TODO: combine with _accessor
	chrome.runtime.onMessage.addListener(function (request, sender, reply) {
		onMessage(reply, request)
	})

}


// chrome extension debugger io
function debuggerMessageResponseMiddleware() {
	function sendCommand() {
		response = chrome.debugger.sendCommand({
			tabId: senderId
		}, 'Runtime.evaluate', {
			expression: expression
		})
	}

	function onMessage() {
		// TODO: insert code for debugger break or signal debugger from engine
	}

	
}


// BECAUSE OF HOW EXTENSIONS WORK, I HAD NO IDEA THAT THE FRONTEND
//   ONLY HAS ACCESS TO LISTEN TO PAGE EVENTS, THIS IS HOW WE PICKUP
//   PAGE EVENTS ON ANY TAB, INSERT A SCRIPT BOX, JSON ENCODE THE DATA
//   WE WANT TO SEND, THEN PRESS A BUTTON TO SEND. MAYBE THE PLUGIN CAN
//   PICK IT UP AND REMOVE THE ELEMENT.
// THIS IS INTERESTING BECAUSE I CAN BASICALLY SEND BACKEND COMMANDS TO 
//   MY OWN FRONTEND PLUGIN IN THE CONTEXT OF THE PAGE.
function domMessageResponseMiddleware() {

	window.addEventListener('load', function () {
		window.addEventListener('message', onMessage, false)

		// check for plugin or emitDownload
		// maybe we don't have the plugin
		let cancelDownload = setTimeout(emitDownload, 3000)
		if(chrome && chrome.runtime) {
			debugger
			chrome.runtime.sendMessage(
				EXTENSION_ID, EXTENSION_VERSION, 
			function () {
				clearTimeout(cancelDownload)
			})
		}

		Sys_fork() // automatically start whatever service worker we have
	})
	
	function onMessage(request) {
		// WHAT IF URLS WERE XPATHS TO FUNCTIONS? AND ROUTING TABLES WHERE JUST FUNCTIONS?
		if(typeof request.accessor != 'undefined') {
			let lib 
			let dialog = doDialog(request, sendMessage)
			if(dialog) { // REPL?
				return dialog
			} else
			if((lib = onAccessor(request))) {
				return sendMessage(lib)
			} else
			if(typeof doRun != 'undefined') {
				doRun(request.accessor, {
					window: window,
					ACE: ACE,
				}) // NOW IT'S RECURSIVE
			}
		}
	}

	function sendMessage(data) {
		window['run-script'].value = JSON.stringify(data)
		window['run-accessor'].click()	
	}

}

function workerMessageResponseMiddleware() {
		
	function sendMessage(data) {
		self.postMessage(data)
	}

	function onMessage(request) {
		let lib
		if((lib = onAccessor(request))) {
			return sendMessage(lib)
		} else
		if(typeof doRun != 'undefined') {
			doRun(request.accessor, {
				window: globalThis,
				global: globalThis,
				self: self,
			}) // NOW IT'S RECURSIVE
		}
	}

	self.onmessage = onMessage

	self.addEventListener('install', function () {
		debugger
	})

}



function serviceMessageResponseMiddleware() {

	// TODO: THIS WOULD BE COOL TO GENERATE PALETTE.SHADER FILES ON
	//   AHEAD OF TIME, OR GIVE USERS INSTANT OFFLINE ACCESS TO 
	//   "PREVIEW" ROUTES LIKE /?EDIT-ANYWHERE/GOOGLE.COM/INDEX.HTM,
	//   SHOW VERSIONED OUTPUT FROM "LIVE" EDIT MODE, WHERE PUSHHISTORY()
	//   CHANGES THE PAGE AND USER CAN REFRESH TO SEE CORRECT VERSION
	//   GENERATED IN LOCAL CACHE BY MAKEFILE-URL. USE CACHE-URLS AS 
	//   MAKE TARGETS?
	self.addEventListener('install', function(event) {
	})

	self.addEventListener('activate', function(event) {
	})

	self.addEventListener('fetch', function(event) {
		// TODO: fetch curious URLs in order to communicate, 
		//   pregenerate stuff to save in cache?
	})

}



// TODO: copy from jupyter notebook but remove even the 
//   notebook part and just handle the request data
function googleMessageResponseMiddleware() {
	function sendMessage() {

	}

	function onMessage() {

	}

}


// emit tooling for making web.js work
function expressMessageResponseMiddleware() {

}


// TODO: copy from amazon
function amazonMessageResponseMiddleware() {

}


// TODO: wire up status, execute, meta kernel to same frontend
function jupyterMessageResponseMiddleware() {

}


// USE Q3 NETWORKING AND ENTITY STATE TO COMMUNICATE CODE AND RPC GOALS
//  EITHER THROUGH PROXY SERVER OR THROUGH PLUGIN BACKEND SERVER
function page2pageMessageResponseMiddleware() {
	// 
}


// TODO: wire up status, execute, meta kernel to same frontend
function githubMessageResponseMiddleware() {
	// FORCE GITHUB INTO BEING A MESSAGE QUEUE LIKE SQS USING COMMITS, 
	//   BRANCHES AND ACTIONS FOR COALLESCING THE STATE
}


function cliMessageResponseMiddleware() {
	function sendMessage() {

	}

	function onMessage() {

	}

	// TODO: at least send signal

	// TODO: STDIN REPL, this will be neat because when antlr is
	//   added, I an instantly turn any language into a REPL 
	//   similar to `node -e "code..."` or bash, but any language, even MATLAB
	// Connecting R to fuse-fs would be weird. Or using MATLAB's interface
	//   for validating 3D scenes, or picking something out demo-files?
}

// TODO: collabMessageResponseMiddleware() {}


if(typeof module != 'undefined') {
	module.exports = {
		domMessageResponseMiddleware,
		frontendMessageResponseMiddleware,
		backendMessageResponseMiddleware,
		workerMessageResponseMiddleware,
		serviceMessageResponseMiddleware,
		
	}
}

