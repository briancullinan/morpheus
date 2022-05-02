
let oldRunTimer
if(typeof window == 'undefined') {
  globalThis.window = globalThis
}

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
		reply({
			stopped: _encodeRuns()
		})
		return
	}
	if(!request.script || !request.script.length) {
		reply({ line: -1, error: 'No script!' })
		return
	}
	// TODO: improve this interface for adding commands
	//   this is kind of speciality sidebar/ui stuff.
	if(request.listWindows) {
		debugger
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
	}, {
		// google extension-style API calls
		chrome: {
			tabs: {
				get: chrome.tabs.get,
				// GOOGLE COLLAB IS COOL AND ALL, BUT IT'S
				//   NOT LIKE I CAN EDIT COLLAB SOURCE CODE
				//   AND HACK MY OWN SHARED UI LIKE I CAN HERE \/
				sendMessage: _sendMessage,
			},
			debugger: {
				getTargets: chrome.debugger.getTargets,
				sendCommand: _sendCommand,
			},
			windows: {
				get: chrome.windows.get,
				update: chrome.windows.update,
				create: _createWindow, // snoop on navigation url
			},
			profiles: {
				list: function () { return morphKey }
			},
		},
	}), 300)

	// send a list of recent runs so we can reattach to other browser sessions
	//   this is one thing that always annoyed me about jupyter is needing a
	//   separate session for every file of code, those two things have nothing
	//   to do with each other, it's a bad design.
	if(!oldRunTimer) {
		oldRunTimer = setInterval(pruneOldRuns, 1000)
	}
	reply({ 
		started: _encodeRuns(),
	})
}


// SINK
function _encodeRuns() {
	return JSON.stringify(Object.keys(threads)
		.map(function (runId) {
			return [
				runId[0] + '******' + runId[runId.length-1],
				threads[runId].bubbleTime
			]
		}))
}


const THREAD_SAVE_TIME = 3 * 1000 // * 60


function pruneOldRuns() {
	// i just thought maybe a transpiler converted code to var which changes scope and
	//   could make it vulnerable?
	let runIds = Object.keys(threads)
	for(let i = 0; i < runIds.length; i++) {
		let senderId = threads[runIds[i]].senderId
		if(threads[runIds[i]].ended
			&& Date.now() - threads[runIds[i]].bubbleTime > THREAD_SAVE_TIME) {
			delete threads[runIds[i]]
			doStatus({ senderId: senderId }, false)
		}
	}
	if(Object.keys(threads).length == 0) {
		clearInterval(oldRunTimer)
		oldRunTimer = null
	}
}


chrome.runtime.onMessage.addListener(function (request, sender, reply) {
	// attach debugger
	await attachDebugger(sender.tab.id)
	doMessage(request, sender, reply)
})


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
	let runContext
	if(details.frameId && typeof foundFrames[details.frameId] != 'undefined') {
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
			runContext = dbgTab
			if(details.frameId != 0) {
				foundFrames[details.frameId] = dbgTab
			}
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
		if(!runContext.queueRate) {
			runContext.queueRate = []
		}
		runContext.queueRate.push(Date.now())
	}
}


function doWebNavigation(details) {
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
	return cookie.split(';')
		.reduce(function (obj, cookieBite) {
			let cookieKeyValue = cookieBite.split('=')
			let cookieName = cookieKeyValue.length > 1
				? cookieKeyValue[0]
				: cookieBite[0]
			obj[cookieName] = cookieBite.includes('=')
				? cookieKeyValue[1][1] + cookieKeyValue[1]
						.substring(1).replace(/./g, '*')
				: cookieBite
						.substring(1).replace(/./g, '*')
			return obj
		}, {})
}



// INTERESTING, WE USE TO FOCUS ON MAN-IN-THE-MIDDLE 
//   ON SOMEONE ELSE'S, BUT NOW I'M DOING IT TO MY OWN 
//   CLOUD CONTROLLED WEB-BROWSER. CLOUD + MITM?
//   GHOST-MAN-IN-THE-MIDDLE? https://en.wikipedia.org/wiki/Ghost_(1990_film)
// SINK!!
async function addCookie(cookie, page) {
	let cookieEncoded = JSON.stringify(encodeCookie(cookie))
	await doMorpheusPass(false)
	if(!temporaryEncrypter) {
		// silently fail
		return cookieEncoded
	}

	let result = chrome.storage.sync.get(cookieKey)
	// this says encrypt but it's not the part that needs to be secured
	//   this is just to differentiate profiles in the index
	// it needs to stay the same between runs, but different for each environment login
	let cookieKey = temporaryEncrypter(temporaryUser + 'Cookies')
	let cookieSessions
	if(!result[cookieKey]) {
		cookieSessions = {}
	} else {
		cookieSessions = JSON.parse(result[cookieKey])
	}

	let leftStr = page.replace(/https|http|\//ig, '')
	if(typeof cookieSessions[leftStr] == 'undefined') {
		// again this is just to add a bit of randomness for each page key
		let cookieKey = temporaryEncrypter(temporaryUser + leftStr)
		cookieSessions[leftStr] = cookieKey
	}
	// encrypte encoded cookies for storage for quick lookup
	cookieSessions[cookieKey+'_encoded'] = temporaryEncrypter(cookieEncoded)
	chrome.storage.sync.set({
		cookieSessions: JSON.stringify(cookieSessions)
	})
	let cookieStorage = {}
	// THIS IS THE PART THAT ACTUALLY NEEDS TO BE ENCRYPTED
	cookieStorage[cookieKey] = temporaryEncrypter(cookie)
	chrome.storage.sync.set(cookieStorage)
	return cookieEncoded
}


let saveCookies = {}


function doWebComplete(details) {
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
	// don't actually care if this completes, just that it happens in the right order
	// AWAIT LOCK, LIKE A RACE-CONDITION WITH WAITING FOR 
	//   MULTIPLE PROMISES, INTERESTING IT CAN CAUSE PAGE TO STALL.
	// no return
	saveCookies[details.frameId] = (function (url) {
		return setTimeout(async function () {
			let cookie = await _doAccessor({
				object: { name: 'document' },
				property: { name: 'cookie' },
			}, runContext, details.tabId || runContext.localVariables.tabId)
			if(!cookie) {
				return
			}
			let cookieEncoded = JSON.stringify(encodeCookie(cookie))
			chrome.tabs.sendMessage(runContext.senderId, {
				// TODO: encrypt encoded stuff with runContext.runId
				cookie: cookieEncoded
			}, function () {})
			//Promise.resolve(addCookie(cookie, url))

		}, 100)
	})()

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


function doCommitted(details) {
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



