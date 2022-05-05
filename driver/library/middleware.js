


// CODE REVIEW, NOW THESE BECOME THE ONLY REPETATIVE STUFF I HAVE TO
//   INCLUDE IN EVERY CONTEXT INSTEAD OF A HUGE LIBRARY OF CODE.


// this is for routines that have call-backs, like hooks back into the app
//   from a web event, online stores do this. for services with a callback
//   like email marketing or zapier


function asyncTriggerMiddleware(onMessage, sendMessage) {
	const COMMAND_TIMEOUT = 3000

	if(typeof awaitInterval == 'undefined') {
		globalThis.awaitInterval = setInterval(asyncFrameTrigger, 1000/60)
	}

	// BECAUSE THIS IS CALLED MULTIPLE TIMES BUT I WAS TREATING THIS LIKE STATIC
	//let awaitingResponse = {}
	if(typeof awaitingResponse == 'undefined') {
		globalThis.awaitingResponseCancel = []
		globalThis.awaitingResponseQueue = []
		globalThis.awaitingResponseTimes = []
	}

	function awaitOrTimeout(request) {
		// access a client variable they've shared from code
		// basic client status message

		// only request.script expects a response
		//   request.status messages are one way so don't generate a 
		//   callback or a promise wait
		if(request && typeof request.script == 'undefined') {
			return Promise.resolve(sendMessage(request))
		}

		if(request && typeof request.responseId == 'undefined') {
			request.responseId = getRunId(20)
		}

		// THIS IS PURELY FOR TECHNICALLY MATCHING CLICKS ON THE PAGE
		//   BACK UP WITH THE RIGHT PROCESS, THIS IS NOT A SECURITY THING.
		return new Promise(function (resolve) {
			awaitingResponseCancel.push(request.responseId)
			awaitingResponseQueue.push(resolve)
			awaitingResponseTimes.push(Date.now())
			return sendMessage(request)
		}).then(onMessage)
	}
	// I ran into a weird bug where creating too many 
	//   timers was causing seg-fault
	//   it might be nice to capture that here.
	function asyncFrameTrigger() {
		if(awaitingResponseTimes.length == 0) {
			return
		}
		while(Date.now() - awaitingResponseTimes[0] > COMMAND_TIMEOUT) {
			let resolve = awaitingResponseQueue.shift()
			awaitingResponseTimes.shift()
			let responseId = awaitingResponseCancel.shift()
			return resolve({
				fail: 'Response timed out.',
				responseId: responseId
			})
		}
	}

	function forwardResponseById(response) {
		let responseIndex
		if(response && typeof response.responseId != 'undefined'
				&& (responseIndex = awaitingResponseCancel.indexOf(response.responseId)) > -1) {
				let resolve = awaitingResponseQueue.splice(responseIndex, 1)[0]
				awaitingResponseTimes.splice(responseIndex, 1)
				awaitingResponseCancel.splice(responseIndex, 1)
				return resolve(response)
		} else {
			return onMessage(response)
		}
	}

	return {
		awaitOrTimeout,
		forwardResponseById,
	}
}



if(typeof module != 'undefined') {
	module.exports = {
		asyncTriggerMiddleware,
	}
}
