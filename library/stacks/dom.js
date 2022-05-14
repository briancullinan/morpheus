
const MIDDLEWARE_FRONTEND = [
	'onFrontend',
	'emitDownload',
	'domMessageResponseMiddleware',
].concat(MIDDLEWARE_DEPENDENCIES)



// BECAUSE OF HOW EXTENSIONS WORK, I HAD NO IDEA THAT THE FRONTEND
//   ONLY HAS ACCESS TO LISTEN TO PAGE EVENTS, THIS IS HOW WE PICKUP
//   PAGE EVENTS ON ANY TAB, INSERT A SCRIPT BOX, JSON ENCODE THE DATA
//   WE WANT TO SEND, THEN PRESS A BUTTON TO SEND. MAYBE THE PLUGIN CAN
//   PICK IT UP AND REMOVE THE ELEMENT.
// THIS IS INTERESTING BECAUSE I CAN BASICALLY SEND BACKEND COMMANDS TO 
//   MY OWN FRONTEND PLUGIN IN THE CONTEXT OF THE PAGE.
function domMessageResponseMiddleware() {
	let {
		awaitOrTimeout,
		forwardResponseById,
	} = asyncTriggerMiddleware(onMessage, sendMessage)
	
	function onMessage(data) {
		return doAccessor(data)
		.then(function (response) {
			return onAccessor(response)
		}).then(sendMessage)
	}

	function sendMessage(data) {
		let runScript = document.getElementById('run-script')
		if(runScript) {
			window['run-script'].value = JSON.stringify(data)
			window['run-accessor'].click()
		}
		if(SYS.worker) {
			SYS.worker.postMessage(data)
		}
	}

	window.addEventListener('load', function () {
		window.addEventListener('message', function (request) {
			return Promise.resolve(doAccessor(request))
				.then(function (response) {
					return onAccessor(response)
				}).then(sendMessage)
		})
		window.sendMessage = awaitOrTimeout
		window.onMessage = forwardResponseById
		// check for plugin or emitDownload
		// maybe we don't have the plugin
		// TODO: .bind(null, 'morph-plugin')
		let cancelDownload = setTimeout(emitDownload, 3000)
		if(chrome && chrome.runtime) {
			chrome.runtime.sendMessage(
				EXTENSION_ID, EXTENSION_VERSION, 
			function () {
				clearTimeout(cancelDownload)
			})
		}

		// sys_worker
		Sys_fork() // automatically start whatever service worker we have

		// TODO: update for lvlworld engine only?
		if(typeof SYS.worker != 'undefined') {
			awaitOrTimeout({
				script: 'loadDocumentation();\nupdateFilelist("Instructions");\n'
			})
		}
	})
	
}



