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
		senderId: sender.tab.id,
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
let foundFrames = {}

function findFrame(details) {
	if(!details.frameId) {
		return
	}
	let runContext
	if(typeof foundFrames[details.frameId] != 'undefined') {
		runContext = foundFrames[details.frameId]
	}
	// IF THE USER DECIDES TO START MESSING AROUND IN THAT WINDOW
  //   PAUSE THE SCRIPT SO WE CAN DEBUG MISSING ELEMENTS!
  // WHY DID NO ONE AT JETBRAINS THINK OF THIS? SWITCHING WINDOWS IS FUN!
	// PAUSE THE SCRIPT!
	let runIds = Object.keys(threads)
	for(let i = 0; i < runIds.length; i++) {
		let dbgTab = threads[runIds[i]] // tab being managed?
		// check if the local tabId has been set
		if(dbgTab && dbgTab.localVariables.tabId == details.tabId) {
			runContext = foundFrames[details.frameId] = dbgTab
			break
		}
	}
	if(!runContext) {
		return
	}

	// sometimes users type these in wrong and the browser fixes it automatically
	// DON'T USE THIS AS A REASON TO PAUSE FROM INTERFERENCE
	let leftStr = runContext.localVariables.navigationURL.replace(/https|http|\//ig, '')
	let rightStr = details.url.replace(/https|http|\//ig, '')
	if(!leftStr.localeCompare(rightStr)
		|| (ALLOW_REDIRECT 
			&& !leftStr.localeCompare(rightStr.substring(0, leftStr.length)))
			//&& details.transitionQualifiers
			//&& details.transitionQualifiers.includes('server_redirect'))
	) {
		// WE KNOW THE REQUEST CAME FROM A SCRIPT AND NOT FROM THE USER
		runContext.networkStarted = true
		runContext.documentId = details.parentDocumentId || details.documentId
		return foundFrames[details.frameId]
	}
}


async function doWebNavigation(details) {
	findFrame(details)
	let runContext = foundFrames[details.frameId]
	if(!runContext) {
		return
	}
	// is there an API that does this?
	//    someway to settle the navigateTo() command
	if(!runContext.queueRate) {
		runContext.queueRate = []
	}
	runContext.queueRate.push(Date.now())
	/*
	chrome.tabs.sendMessage(details.tabId || runContext.localVariables.tabId, { 
		headers: {

		}
	}, function(response) {

	})
	return await chrome.tabs.sendMessage(runContext.senderId, {
		headers: {
			
		}
	}, function(response) {

	})
	*/
}


function encodeCookie(cookie) {
	return cookie.result.value.split(';')
		.reduce(function (obj, cookieBite) {
			let cookieKeyValue = cookieBite.split('=')
			let cookieName = cookieKeyValue.length > 1
				? cookieKeyValue[0]
				: cookieBite[0]
			obj[cookieName] = cookieBite.includes('=')
				? cookieKeyValue[1][1] + cookieKeyValue[1]
						.substring(1).replace(/./, '*')
				: cookieBite
						.substring(1).replace(/./, '*')
		}, {})
}



async function addCookie(cookie, page) {
	await doMorpheusPass(true)
	if(!temporaryEncrypter) {
		return
	}
	let leftStr = page.replace(/https|http|\//ig, '')
	// this says encrypt but it's not the part that needs to be secured
	//   this is just to differentiate profiles in the index
	let cookieKey = temporaryEncrypter(temporaryUser + 'Cookies')
	let result = await chrome.storage.sync.get(cookieKey)
	let cookieSessions
	if(!result[cookieKey]) {
		cookieSessions = {}
	} else {
		cookieSessions = JSON.parse(result[cookieKey])
	}
	if(typeof cookieSessions[leftStr] == 'undefined') {
		// again this is just to add a bit of randomness for each page key
		let cookieKey = temporaryEncrypter(temporaryUser + leftStr)
		cookieSessions[leftStr] = cookieKey
	}
	let cookieEncoded = JSON.stringify(encodeCookie(cookie))
	cookieSessions[cookieKey+'_encoded'] = temporaryEncrypter(cookieEncoded)
	await chrome.storage.sync.set({
		cookieSessions: JSON.stringify(cookieSessions)
	})
	let cookieStorage = {}
	// THIS IS THE PART THAT ACTUALLY NEEDS TO BE ENCRYPTED
	cookieStorage[cookieKey] = temporaryEncrypter(cookie)
	await chrome.storage.sync.set(cookieStorage)
	return cookieEncoded
}




async function doWebComplete(details) {
	findFrame(details)
	let runContext = foundFrames[details.frameId]
	if(!runContext) {
		return
	}
	if(!runContext.queueRate) {
		runContext.queueRate = []
	}
	let nowish = runContext.queueRate.shift()
	if(Date.now() - nowish < 1000) {
		runContext.queueRate.unshift(nowish)
	}
	let cookie = await chrome.debugger.sendCommand({
		tabId: details.tabId || runContext.localVariables.tabId
	}, 'Runtime.evaluate', {
		// TODO: attach encrypter to every page for forms transmissions
		expression: 'document.cookie'
	})
	if(!cookie.result || !cookie.result.value) {
		return
	}
	let cookieEncoded = await addCookie(cookie, runContext.localVariables.navigationURL)
	return await chrome.tabs.sendMessage(runContext.senderId, {
		cookie: cookieEncoded // J/K cookie.result.value
	}, function(response) {

	})
}


// GAH! THIS IS THE SAME PASSWORD CRAP THAT MOTIVATED ME TO DO THIS 
//   THE FIRST TIME. I AM SO SICK OF THIS SECURITY, ADD MORE CRAP
//   SECURITY ON TOP OF PREVIOUS CRAP SECURITY. 2FA, NOW I WILL HAVE
//   TO BUILD AN AUTOMATED PHONE PHARM. ESCALATION. I HAVE TO ADD 
//   GEL FINGERS SO IT FEELS LIKE A REAL FINGER TO RECAPTCHA SENSORS.
// ONE CO-WORKER HAD A KEYFOB AND HE WAS VULNERABLE TO MY E-MAIL ATTACK.
//   I SENT AN EMAIL FROM HIS BOSS ASKING FOR CREDENTIALS TO BE GIVEN TO ME. 
//   THEN RESIGNED. BECAUSE NO ONE WAS FIXING MY PROBLEMS, LIKE NEVER 
//   ENTERING A PASSWORD. 
// IF NO ONE CAN KEEP THE INTERNET SAFE FOR ASPIES LIKE ME, THEN I'LL
//   NEED TO CREATE AN ENTITY THAT DOES WHAT I WANT WITHOUT PUTTING MYSELF
//   AT RISK. ONLY THEN, CAN I STILL BE PRODUCTIVE WITHOUT BEING PRESENT.
// OH, JUST USE A PASSWORD MANAGER. OK. I STILL HAVE TO GO TO THE LOGIN 
//   PAGE OR SIGNUP PAGE AND CLICK SAVE PASSWORD. YOU'RE MISSING THE POINT.
//   I MEAN I WANT ACCESS TO PUBLIC SERVICES WITHOUT BEING KNOWN. FUCK OFF.
// PEOPLE BITCH ABOUT MEDICAL PRIVACY, PERFECT EXAMPLE OF ADDING MORE BULLSHIT
//   NO ONE NEEDS INBETWEEN ME AND MY DATA. Y'ALL HAVE NO IDEA WHAT EXTREMES
//   I CAN GO TO, TO ACHIEVE ANONYMITY. BOTH EXTREMES. IF PEOPLE ONLY KNOW
//   WHAT I LEAVE BEHIND, THEN I'LL CERTAINLY CEASE TO EXIST.


async function doCommitted(details) {
	findFrame(details)
	if(!foundFrames[details.frameId]) {
		return
	}
	let dbgTab = foundFrames[details.frameId]
	if(!dbgTab.documentId) {
		return
	}
	if(details.documentId != dbgTab.documentId
		&& details.parentDocumentId != dbgTab.documentId
	) {
		debugger
		dbgTab.paused = true
		// ^ more important
		// send a paused status back to the frontend
		chrome.tabs.sendMessage(dbgTab.senderId, { 
			paused: details.timeStamp
		}, function(response) {

		})
	}
}

chrome.webNavigation.onBeforeNavigate.addListener(doWebNavigation)
chrome.webNavigation.onCompleted.addListener(doWebComplete)
chrome.webNavigation.onCommitted.addListener(doCommitted)


// TODO: inject scripts
/*
chrome.webNavigation.onBeforeNavigate.addListener(
  callback: function,
  filters?: object,
)

*/


/*
// TODO: store cookies and session changes, encrypted locally

async function injectRequest(details) {
	debugger
	// restore session from encrypted storage
}

async function saveResponse(details) {
	debugger
	// restore session from encrypted storage
}


function attachRequestHandlers(tabId, windowId) {
	//onBeforeRequest
	chrome.webRequest.onBeforeSendHeaders.addListener(
		injectRequest, {
			urls: ['<all_urls>'], 
			tabId: tabId,
			windowId: windowId
		}, 
		['blocking', 'requestHeaders'])

	chrome.webRequest.onHeadersReceived.addListener(
		saveResponse, 
		{
			urls: ['<all_urls>'], 
			tabId: tabId,
			windowId: windowId
		}, 
		['blocking', 'responseHeaders'])

	chrome.webRequest.onAuthRequired.addListener(
		doMorpheusAuth, {
			urls: ['<all_urls>'], 
			tabId: tabId,
			windowId: windowId
		}, 
		['asyncBlocking'])

}
*/


