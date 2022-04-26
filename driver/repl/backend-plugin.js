let window = self;

// TODO: WAS GOING TO USE THIS AS A TEMPLATE FOR 
//   BOOKMARKS2PDF. NO SCRIPTING, NO ACE, JUST BACKEND
//   CMD RUNNER. HIDDEN WINDOW?

function doMessage(request, sender, reply) {
	let AST

	if(!request.script && request.runId) {
		doStatusResponse(request, reply)
		return
	}
	if(!request.script && typeof request.frontend != 'undefined') {
		reply({ stopped: '.' })
		return
	}
	if(!request.script || !request.script.length) {
		reply({ line: -1, error: 'No script!' })
		return
	}

	try {
		console.log('title:', sender.tab.title)
		console.log('url:', sender.tab.url)
		console.log('id:', request.runId)
		console.log('script:', request.script)
		AST = acorn.parse(
			'(function () {\n' + request.script + '\n})()\n'
			, {ecmaVersion: 2020, locations: true, onComment: []})
	} catch (e) {
		// return parser errors right away
		debugger
		console.log(e)
		reply({ error: e.message + '' })
		return
	}

	// TODO: REPL authorization here	

	setTimeout(doPlay.bind(null, {
		body: AST.body,
		script: request.script,
		runId: request.runId,
	}), 300)

	reply({ started: request.runId })
}

chrome.runtime.onMessage.addListener(doMessage)


function doInstall() {
	self.clients.matchAll(/* search options */)
  .then( (clients) => {
		if (clients && clients.length) {
			// you need to decide which clients you want to send the message to..
			const client = clients[0];
			client.postMessage({
        service: 'Backend service started\n'
      });
		}
	})
}

self.addEventListener('install', doInstall)


// TODO: make optional with @attribute
let ALLOW_REDIRECT = true

//chrome.webNavigation.onBeforeNavigate.addListener(function(request, event) {

//})


function doWebRequest(details) {
  // IF THE USER DECIDES TO START MESSING AROUND IN THAT WINDOW
  //   PAUSE THE SCRIPT SO WE CAN DEBUG MISSING ELEMENTS!
  // WHY DID NO ONE AT JETBRAINS THINK OF THIS? SWITCHING WINDOWS IS FUN!
	// PAUSE THE SCRIPT!
	let runIds = Object.keys(threads)
	for(let i = 0; i < runIds.length; i++) {
		let dbgTab = threads[runIds[i]] // tab being managed?
		// check if the local tabId has been set
		if(dbgTab && dbgTab.localVariables.tabId == details.tabId) {
			// sometimes users type these in wrong and the browser fixes it automatically
			// DON'T USE THIS AS A REASON TO PAUSE FROM INTERFERENCE
			let leftStr = dbgTab.navationURL.replace(/https|http|\//ig, '')
			let rightStr = details.url.replace(/https|http|\//ig, '')
			if(!leftStr.localeCompare(rightStr)
				|| (ALLOW_REDIRECT 
					&& details.transitionQualifiers.includes('server_redirect'))
			) {
				// WE KNOW THE REQUEST CAME FROM A SCRIPT AND NOT FROM THE USER
				dbgTab.documentId = details.parentDocumentId 
					|| details.documentId
			} else if(details.documentId != dbgTab.documentId
				&& details.parentDocumentId != dbgTab.documentId) {
				debugger
				dbgTab.paused = true
				// ^ more important
				// send a paused status back to the frontend
				chrome.tabs.sendMessage(dbgTab.senderId, { 
					paused: details.timeStamp
				}, function(response) {

				})
			}
			break
		}
	}
}

chrome.webNavigation.onCommitted.addListener(doWebRequest)


