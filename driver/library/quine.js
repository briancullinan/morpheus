// emit self in a cloud-compatible way.
// SELF EXTRACTOR LIKE BUSYBOX
// quines have a life-expectancy, we should be up-front with 
//   them about that so they don't come back to kill us like Roy.

// convert makefile to jupyter notebook for storage in collab / download.
//   does jupyter support encryption?

// CODE REVIEW: I'VE COMBINED DEPENDENCY INJECTION FROM MY MAKEFILE
//   WITH EXPRESS STYLE MIDDLEWARES FOR FEATURE SPECIFICS.

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
	if(typeof ACE != 'undefined') {
		ACE.downloaded = true
	}
	if(!fileName) {
		return
	}
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


// SHORTER LIST OF DEPENDENCIES THAN EMSCRIPTEN?
const MIDDLEWARE_DEPENDENCIES = [
	'getRunId',
	'generateRunId',
	'asyncTriggerMiddleware',
	'encryptedResponseMiddleware',
	'installEncryptedAsyncMiddleware',
]

const MIDDLEWARE_FRONTEND = [
	'onFrontend',
	'emitDownload',
	'domMessageResponseMiddleware',
].concat(MIDDLEWARE_DEPENDENCIES)

const MIDDLEWARE_BACKEND = [
	'workerMessageResponseMiddleware',
].concat(MIDDLEWARE_DEPENDENCIES)

const MIDDLEWARE_REPL = [
	'replAccessorMiddleware',
	'readPreFS',
	'_base64ToArrayBuffer',
]

// have to do this to build
const MIDDLEWARE_CLI = [
	'cliMiddleware'
]



// TODO: extrapolate complexity in the client sending the first request
//   without any session or response ids established and the server returning
//   the first session id to use for encryption
function installEncryptedAsyncMiddleware(onMessage, sendMessage) {

	let {
		encryptResults,
	} = encryptedResponseMiddleware(decryptResponseIfSession, sendMessage)

	let {
		awaitOrTimeout,
	} = asyncTriggerMiddleware(onMessage, sendMessage)

	let {
		awaitOrTimeout: encryptedAwait,
		forwardResponseById,
	} = asyncTriggerMiddleware(onMessage, encryptResults)

	let {
		decryptResponse,
	} = encryptedResponseMiddleware(forwardResponseById, encryptResultsIfSession)

	function encryptResultsIfSession (request) {
		if(request.responseId) {
			return encryptedAwait(request)
		}
		return awaitOrTimeout(request)
	}

	function decryptResponseIfSession (response) {
		// TODO: generate a new session for every runId?

		// prevent recursion
		if(response.responseId && response.type == 'encrypted') {
			// CODE REVIEW? using middleware pattern for logic isolation? seperation of concerns? 
			// TODO: now can remove these checks from encrypt/decrypt to make more generalized
			return decryptResponse(response)
		}
		return forwardResponseById(response)
	}

	return {
		encryptResultsIfSession,
		decryptResponseIfSession,
	}
}


// install encrypted middleware in all the communications
//   passed through here, this is simply to prevent and sniffy/
//   logging plugins from saving some data to disk accidentally.
// this is not meant to stop authorities.
function encryptedResponseMiddleware(onMessage, sendMessage) {

	// accessors on all ends will expect their results to be symmetrically
	//   key encrypted by a pregenerated session id. In the case of plugin
	//   front end, the encryption happens between client page and backend.
	let _temporarySessionEncryptor
	// code review, mark private visually with an _
	let _generateSessionEncryptor = function (sess) {
		_temporarySessionEncryptor = function (data) {
			return crypt(sess, data)
		}
	}
	let _generateResponseDecryptor = function (sess) {
		return function (data) {
			data.value = JSON.parse(decrypt(sess, data))
			// prevent recursion
			data.type == typeof result
			return data
		}
	}
	let _responseDecryptors = {}

	// for code reviews, always try to decrease the number of sinks.
	function encryptResults(response) {
		if(response && response.result
			// TODO: this plays on client, do we need multiple?
			//   I'd think not since clients (browsers, only allow like 3 connections at a time)
			// so even if they could all proxy out, only so many controls can proxy back in.
				&& typeof _temporarySessionEncryptor != 'undefined') {
			let encrypted = _temporarySessionEncryptor(JSON.stringify(response.result))
			return sendMessage({
				responseId: response.responseId,
				result: { type: 'encrypted', value: encrypted }
			})
		} else {

		}
		// TODO: master password detection
		return sendMessage(response)
	}


	function decryptResponse(results) {
		// sessionId is sent at a different time from the results.
		// sessionId is sent to client for use as the encryption key,
		//   generated by the server. A plugin could sniff the sessionId
		//   ealier and then decrypt the next form results.
		// SINK, encrypt form data directly to remote page, or directly to backend
		//   in case of system password collection, this gurantees the data gets to 
		//   the right page, hopefully without being logged or stolen. So it is doubly
		//   encrypted on disk by the master password. Once a password is entered, replace
		//   the generation function with doubly encryption.
		// this is a result to client end after sending an initial script request
		_generateSessionEncryptor(results.sessionId)
			_responseDecryptors[results.responseId] 
					= _generateResponseDecryptor(results.sessionId)
		// TODO: master password detection
		// if(request.accessor.includes("_password"))
		if(results && results.type && results.type == 'encrypted'
			&& typeof _responseDecryptors[result.responseId] != 'undefined'
		) {
			/* await */ return onMessage(_responseDecryptors[result.responseId](results.value))
		} else {
			throw new Error('There can be only one.')
		}
	}


	return {
		encryptResults,
		decryptResponse,
	}
}


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




// ALL THAT WORK JUST TO UNDERSTAND THIS PART? THIS IS SOMETHING
//   THAT WAS CONFUSING ME, IN WORKER MODE I GUESS I NEED THE 
//   SESSION ENCRYPTION MIDDLEWARE FROM FRONTEND ABOVE ALSO,
// TODO: SHOULD MAKE SURE ENCRYPTION WORKS SIMPLY THROUGH AUTH PROCESS ALSO.

function workerMessageResponseMiddleware() {

	let {
		encryptResultsIfSession,
		decryptResponseIfSession,
	} = installEncryptedAsyncMiddleware(onMessage, self.postMessage) 

	function sendMessage(data) {
		if(data === '[object Object]') {
			debugger
		}
		console.log('request: ', data)
		let asyncResult = encryptResultsIfSession(data)
		console.assert(asyncResult.constructor === Promise) //  === Promise
		return Promise.resolve(asyncResult).then(
		function (result) {
			if(!result) {
				// TODO: fixme, timers are not getting cleared for middleware
				//  too complicated
				//debugger
			}
			console.log('result: ', result)
			return result
		})
	}

	// lol, make a game where lost accounts lead to a virtual court room to prove your identity just like IRL
	//   if someone claims to be Rick (from Rick & Morty) all the other Ricks have to obvserve and allow
	//   or take the new Rick out for not being Ricky enough. - Metaverse
	function onMessage(request) {
		let lib
		if(!request) {
			return
		}
		// this is the only thing worker does?
		return doAccessor(request).then(function (response) {
			if(response && typeof response == 'object') {
				response.responseId = request.responseId
			}
			return Promise.resolve(sendMessage(response))
		})
	}


function readFile(filename) {
	return Array.from(FS.virtual[filename].contents)
		.map(function (c) { return String.fromCharCode(c) })
		.join('')
}

	/*
	var md = new Remarkable('full', {
		html:         false,        // Enable HTML tags in source
		xhtmlOut:     false,        // Use '/' to close single tags (&lt;br /&gt;)
		breaks:       false,        // Convert '\n' in paragraphs into &lt;br&gt;
		langPrefix:   'language-',  // CSS language prefix for fenced blocks
		linkify:      true,         // autoconvert URL-like texts to links
		linkTarget:   '',           // set target to open link in

		// Enable some language-neutral replacements + quotes beautification
		typographer:  false,

		// Double + single quotes replacement pairs, when typographer enabled,
		// and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
		quotes: '“”‘’',

		// Highlighter function. Should return escaped HTML,
		// or '' if input not changed
		highlight: function (str, lang) {
			if (lang && hljs.getLanguage(lang)) {
				try {
					return hljs.highlight(lang, str).value;
				} catch (__) {}
			}

			try {
				return hljs.highlightAuto(str).value;
			} catch (__) {}

			return ''; // use external default escaping
		}
	});
	*/



	if(typeof FS == 'undefined') {
    globalThis.FS = {
      virtual: {}
    }
    globalThis.FS_FILE = (8 << 12) + ((6 << 3) + (6 << 6) + (6))
  }
	readPreFS()

	// this was for a web-worker setup
	if(typeof globalThis != 'undefined' 
			&& typeof globalThis.window == 'undefined') {
		globalThis.window = globalThis
	}
	self.onmessage = async function (request) {
		let result = await decryptResponseIfSession(request.data)
	}
	// BOOTSTRAP?
	Object.assign(globalThis, { 
		sendMessage: sendMessage,
	})

	self.addEventListener('install', function () {
		debugger
	})

}



// shared service worker
function sharedMessageResponseMiddleware() {
	/*
	onchange = function() {
  myWorker.port.postMessage([squareNumber.value,squareNumber.value]);
  console.log('Message posted to worker');
}
onconnect = function(e) {
  var port = e.ports[0];

  port.onmessage = function(e) {
    var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
    port.postMessage(workerResult);
  }
}
*/
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


function discordMessageResponseMiddleware() {
	// very important for exporting to proxy server
}


function socialMessageResponseMiddleware() {
	// various connections to social networking interfaces through one contiguous interface
}


// TODO: collabMessageResponseMiddleware() {}


if(typeof module != 'undefined') {
	module.exports = {
		emitDownload,
		domMessageResponseMiddleware,
		frontendMessageResponseMiddleware,
		backendMessageResponseMiddleware,
		workerMessageResponseMiddleware,
		serviceMessageResponseMiddleware,
		encryptedResponseMiddleware,
		installEncryptedAsyncMiddleware,

	}
}

