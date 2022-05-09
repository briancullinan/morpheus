


const MIDDLEWARE_BACKEND = [
	'workerMessageResponseMiddleware',
].concat(MIDDLEWARE_DEPENDENCIES)

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

