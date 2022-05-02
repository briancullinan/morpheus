
let socket1

function socketOpen(evt) {
}

function socketMessage(evt) {
}

function socketError(evt) {
}



function generateRunId() {
	let runId = getRunId(20)
	return function (request) {
		request.runId = runId
		return request
	}
}



let lastRunId


function runScript() {
	let runScriptTextarea = document.getElementById('run-script')

	if(document.body.className.includes('running')
		|| document.body.className.includes('paused')) {
		chrome.runtime.sendMessage(lastRunId({ 
			pause: !document.body.className.includes('paused'),
		}), window.postMessage)
		return
	}

	try {
		lastRunId = generateRunId()
		if(!runScriptTextarea.value.length) {
			throw new Error('No script!')
		}
		chrome.runtime.sendMessage(lastRunId({ 
			script: runScriptTextarea.value,
		}), window.postMessage)
		runScriptTextarea.value = ''
	} catch (e) {
		// reload the page!
		if(e.message.includes('context invalidated')) {
			document.location = document.location 
			//  + (document.location.includes('?') ? '&' : '?')
			//  + 'tzrl=' + Date.now()
			return
		}
	}
}


document.addEventListener('DOMContentLoaded', onContent)


function onContent() {
	// THIS IS FOR MAKING AN ELEMENT EYE-DROPPER TOOL, NOT STEALING PASSWORDS
	key('shift+w', function () {
		debugger
		chrome.runtime.sendMessage({ 
			// TODO: improve this interface, adding new commands should be smaller?
			listWindows: getRunId(20),
		}, window.postMessage)
	})

	// don't bother other tabs for now
	if(!document.getElementById('run-script')) {
		return
	}

	document.addEventListener('click', function (evt) {
		if(!evt.target) {
			return true
		}
		if(evt.target.className.includes('run-button')) {
			runScript()
		} else if(evt.target.className.includes('run-accessor')) {
			runAccessor()
		} else if (evt.target.id == 'snapWindows') {
			chrome.runtime.sendMessage({ 
				snapWindows: evt.target.checked,
			}, window.postMessage)
		}
	})

	// THIS IS THE NEW STARTUP SEQUENCE, DO A FULL ROUND TRIP AND
	//   GRAB A LIST OF RUNNING SESSIONS
	let responseEventId = getRunId(20)
	awaitingResponse[responseEventId] = function (result) {
		chrome.runtime.sendMessage({ 
			frontend: result,
		}, window.postMessage)
	}
	window.postMessage({
		// make a round trip with the front-end, in case this is the tool page
		frontend: 'Worker service started\n',
		responseId: responseEventId,
	})

}



function runKeypress() {
	// add magnanimus class-name uniquifier eye-dropper tool to every page
	//const s = document.createElement('div');
	//(document.body || document.documentElement).appendChild(s);
	/*
	const s = document.createElement('script');
	s.setAttribute('type', 'text/javascript');
	s.innerHTML = `
		`;
	(document.head || document.documentElement).appendChild(s);
	*/
}


function getRunId(length) {
	let output = []
	let uint8array = crypto.getRandomValues(new Uint8Array(20))
	for (var i = 0, length = uint8array.length; i < length; i++) {
		output.push(String.fromCharCode(uint8array[i]));
	}
	return btoa(output.join(''));
}


let awaitingResponse = {}



function runAccessor() {
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


// HAVING SOME TROUBLE ALIGNING RESPONSES WITH PLACES IN THE SCRIPT
//   THIS WILL BECOME EVEN MORE CONFUSING IN THE FUTURE IF I ADD
//   MULTIPLE PROCESSES AT ONCE.
chrome.runtime.onMessage.addListener(doMessage)


function doMessage(request, sender, reply) {
	if(request.headers) {
		debugger
		/*
		await chrome.declarativeNetRequest.updateDynamicRules({
			options: {
				addRules: [
				]
			}
		})
		*/
		return
	}

	// access a client variable they've shared from code
	// basic client status message
	// THIS IS PURELY FOR TECHNICALLY MATCHING CLICKS ON THE PAGE
	//   BACK UP WITH THE RIGHT PROCESS, THIS IS NOT A SECURITY THING.
	let responseEventId = getRunId(20)
	awaitingResponse[responseEventId] = (function (responseTimer) {
		if(typeof request == 'object' && request) {
			request.responseId = responseEventId
		}
		window.postMessage(request)
		return function (response) {
			clearTimeout(responseTimer)
			reply(response)
			delete awaitingResponse[responseEventId]
		}
	})(setTimeout(function () {
		awaitingResponse[responseEventId]()
		delete awaitingResponse[responseEventId]
	}, 3000))
	return true

}
