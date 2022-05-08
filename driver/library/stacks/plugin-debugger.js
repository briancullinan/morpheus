// TODO: integrate tools like augury because dev 
//   added analytics to track other devs and wont share.
//   also inspired by hatred for Jetbrainz not being open source.

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


