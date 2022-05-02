
let oldRunTimer
if(typeof window == 'undefined') {
  globalThis.window = globalThis
}


// TODO:
// DONE 2 (3?) - Make with ES interpreter, dedicated WASM
// HALF DONE 1 (2) - web worker and SV_Download
// 8 - Pull lvlworld.json and iterate to fix map loader FS_FileNeeded() API
// 2 - Drag drop to call SV_Tracemaps()
// 2 - D3/three.js iterative graph layout -> convert to brushes/3D text
// 1 - Pull q3map2.wasm from frontend
// 4 - SV_MemoryMaps() and dynamic compile
// 2 - Sys_execv() from sys_cli.js

if(typeof chrome == 'undefined') {
	chrome = {}
}
if(typeof chrome.tabs == 'undefined') {
	chrome.tabs = {
		sendMessage: function (senderId, data) {
			self.postMessage(data)
		}
	}
}
if(typeof chrome.debugger == 'undefined') {
	chrome.debugger = {
		getTargets: function () {
			debugger
		}
	}
}


function doMessage(reply, request) {
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


self.onmessage = function (request) {
	doMessage(self.postMessage, request.data)
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

// THIS IS THE NEW STARTUP SEQUENCE, DO A FULL ROUND TRIP AND
//   GRAB A LIST OF RUNNING SESSIONS
{
  let responseEventId = getRunId(20)
  awaitingResponse[responseEventId] = function (result) {
    doMessage({ 
      frontend: result,
    }, self.postMessage)
  }
  self.postMessage({
    // make a round trip with the front-end, in case this is the tool page
    frontend: 'Worker service started\n',
    responseId: responseEventId,
  })
}

