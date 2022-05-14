

// backend worker for chrome extension
function backendMessageResponseMiddleware() {

	// ASYNC AND AWAIT IS DUMB IN JAVASCRIPT, THERE'S ONLY 1 THREAD
	//   this entry basically converts all calls to async
	function sendMessage(data) {
		debugger
		return new Promise(function (resolve) {
			chrome.tabs.sendMessage(currentContext.senderId,
					data,	onMessage.bind(this, resolve))
		})
	}

	let threads = {}

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

	chrome.runtime.onMessage.addListener(function (request, sender, reply) {
		onMessage(reply, request)
	})

}

