
// plugin message response code for frontend worker chrome extension
function frontendMessageResponseMiddleware() {



	// replaced by this function below after the first run

	// for pausing the right script
	let lastRunId = function (request) {
		return request
	}


	function sendMessage() {
		let runScriptTextarea = document.getElementById('run-script')
		if(runScriptTextarea.value.length < 1) {
			return
		}
		forwardResponseById(JSON.parse(runScriptTextarea.value))
	}

	function onMessage(request) {
			// PASSTHROUGH TO DOM
			window.postMessage(request)

			chrome.runtime.sendMessage
		
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

