
/*
navigator.serviceWorker.register('blob:...', {
	updateUrl: '/sw.js'
})
*/

let ACE = {
	consoleLines: 0,
	lastRunId: null,
	playCount: 0,
	playButtons: [],
	downloaded: false,
	filename: false,
	libraryCode: '',
	libraryLines: 0,
	libraryLoaded: false,
}

const NAMED_FUNCTION = /function\s+([a-z]+[ -~]*)\s*\(/
const EXTENSION_ID = 'lnglmljjcpnpahmfpnfjkgjgmjhegihd';
const EXTENSION_VERSION = '1.0'
const RGBA_REGEX = /rgba?\(([^\)]*)\)/
const FADE_DURATION = 1000.0
const FLASH_DURATION = 1000.0

function newPlay() {
	let newButton = document.createElement('BUTTON')
	newButton.className += ' run-button small '
	document.body.appendChild(newButton)
	ACE.playButtons.push(newButton)
	ACE.playCount++
}


function processLineNumber(lineNumber) {
	let prevLine = lineNumber
	if(!lineNumber) { // startup error message?
		return lineNumber
	}
	if(ace.gotoLine) {
		setTimeout(ace.gotoLine.bind(ace, prevLine), 100)
	}
	// if the error occurs on a line inside the library
	let widgetManager = ace.getSession().widgetManager
	if(prevLine < ACE.libraryLines && !ACE.libraryLoaded) {
		ACE.libraryLoaded = true
		let previousLength = ace.session.getLength()
		let previousWidgets = []
		for(let i = 0; i < previousLength; i++) {
			let oldWidgets = widgetManager.getWidgetsAtRow(i)
			oldWidgets.forEach(function (w) { 
				previousWidgets[i] = w
				widgetManager.removeLineWidget(w) 
			})
		}

		let libraryCombinedCode = ACE.libraryCode + ace.getValue()
		ace.setValue(libraryCombinedCode)


		// TODO:  ?????????
		statusWidgets = []


		// Add widgets back in to new line
		for(let i = 0; i < previousLength; i++) {
			if(!previousWidgets[i]) {
				continue
			}
			let newLine = previousWidgets[i].row + ACE.libraryLines - 1
			previousWidgets[i].row = newLine
			widgetManager.addLineWidget(previousWidgets[i]) 
		}

		prevLine--;
	} else if (!ACE.libraryLoaded) {
		// if library code is not loaded, subtract
		prevLine -= ACE.libraryLines
	} else {
		prevLine--;
	}
	return prevLine
}


function processResponse(updateText, lineNumber, error) {
	if (!ace.session || !ace.session.lineWidgets) {
		return
	}
	let newLines = updateText.trim().split('\n')
	let prevLine
	// if error has a line number, insert message below that line
	if(typeof lineNumber == 'number') {
		prevLine = processLineNumber(lineNumber)
	} else {
		// WAS MEANING TO WRITE THIS SOONER
		prevLine = ACE.lastLine - (ACE.libraryLoaded ? 1 : ACE.libraryLines)
	}

	for(let j = 0; j < newLines.length; j++) {
		let newWidget = createLineWidget(newLines[j], prevLine++, error ? 'morph_error' : '')
		ace.getSession().widgetManager.addLineWidget(newWidget)
	}
	// add console output to bottom of code
	if(typeof lineNumber != 'number') {
		ACE.lastLine = prevLine
	}
	
}

function runAccessor() {
	// TODO: some error checking?
}


function runBlock(start) {
	if(document.body.className.includes('running')
		|| document.body.className.includes('starting')) {
		return
	}

	document.body.classList.add('starting')
	if(!ACE.downloaded) {
		setTimeout(emitDownload, 3000)
	}

	if(!ACE.libraryCode) {
		initLibraries()
	}

	if(start == -1) {
		window['run-script'].value = 
			// because library inserted into page on error
			(!ACE.libraryLoaded ? ACE.libraryCode : '')
			+ window.ace.getValue()
			+ '\nreturn main();'
		ACE.lastLine = ACE.libraryLines + ace.session.getLength()
	} else {
		let funcName = NAMED_FUNCTION.exec(ace.env.document.getLine(start))[1]
		ACE.lastLine = ACE.libraryLines + ace.session.getFoldWidgetRange(start).end.row
		window['run-script'].value = 
			(!ACE.libraryLoaded ? ACE.libraryCode : '')
			+ ace.session.getLines(start, ACE.lastLine).join('\n')
			+ '\nreturn ' + funcName + '();\n'
	}

}



async function emitDownload() {
	if(!document.body.className.includes('starting')) {
		return 
	}

	if(chrome && chrome.runtime) {
		let response = await chrome.runtime.sendMessage(EXTENSION_ID, EXTENSION_VERSION)
		if(response) {
			return
		}
	}

	// maybe we don't have the plugin
	if(!ACE.downloaded) {
		let file = FS.virtual['morph-plugin.crx'].contents
		let blob = new Blob([file], {type: 'application/x-chrome-extension'})
		let exportUrl = URL.createObjectURL(blob);
		const tempLink = document.createElement('A');
		tempLink.style.display = 'none';
		tempLink.href = exportUrl;
		tempLink.setAttribute('download', 'morph-plugin.zip');
		document.body.appendChild(tempLink);
		tempLink.click();
		ACE.downloaded = true
		URL.revokeObjectURL(exportUrl);
	}

	if(ACE.downloaded) {
		onError({line: -1, error: 'Error connecting to DevTools service.'})
		document.body.classList.remove('starting')
		document.body.classList.add('running')
		document.body.classList.add('error')
		runBlock(-1)
	}

}



// MAYBE A FUCKING WARNING HERE LIKE CALL STACK EXCEEDED?
//   HOW ABOUT "FOR LOOP LENGTH EXCEEDED"? FUCKING AMAZING HOW AWFUL 
//   PROGRAMMING IS, NO WONDER THERE'S BUGS
// for(let i = 0; i < ace.session.lineWidgets.length; i++) {
//   modified ace.session.lineWidgets 
// C# HAS THIS WARNING MAYBE MY PROBLEM IS LANGUAGE




// WHAT THE FUCK? HOW TO ACCESS ace.config.loadModule("./ext/error_marker") or line_widgets?
function initLineWidgets() {
	ace.env.editor.execCommand('goToNextError')
	let widgetManager = ace.getSession().widgetManager
	let errorRow = ace.getCursorPosition().row
	let errorWidgets = widgetManager.getWidgetsAtRow(errorRow)
	errorWidgets.forEach(function (w) { widgetManager.removeLineWidget(w) })
}


function createLineWidget(text, line, classes) {
	if (!ace.session || !ace.session.lineWidgets) {
		initLineWidgets()
	}
	let newHelp = document.createElement('DIV')
	newHelp.className += ' ace_line ' + (classes || '')
	//newHelp.style.top = ((line + 1) * ace.renderer.lineHeight) + 'px'
	let newWidget = {
		row: line,
		html: '<span class="ace_comment">' + text + '</span>',
		el: newHelp,
		pixelHeight: ace.renderer.lineHeight,
		rowCount: 1,
	}
	newHelp.innerHTML = newWidget.html
	// WHAT THE FUCK? LINE ISN'T SHOWING UP!!!
	return newWidget
}



function displayBlockCall(start, evt) {
	let lastLine = ace.session.getFoldWidgetRange(start).end.row
	let funcName = NAMED_FUNCTION.exec(ace.env.document.getLine(start))[1]
	if(lastLine < 0) {
		lastLine = ace.session.length()
	}
	createLineWidget(funcName + '();', lastLine, 'morph_hint')
}


function updatePlay() {
	if (!ace.session.lineWidgets) {
		initLineWidgets()
	}
	let buttonCounter = 0
	let start = ace.renderer.layerConfig.firstRow
	let count = ace.renderer.layerConfig.lastRow - start
	//let numWidgets = 0
	for(let i = start; i < start + count; i++) {
		if(ace.session.foldWidgets[i] == 'start' 
			// only match functions with names
			&& ace.session.getLine(i).match(NAMED_FUNCTION)
		) {
			if(ACE.playCount <= buttonCounter) {
				newPlay()
			}
			ACE.playButtons[buttonCounter].onclick = runBlock.bind(null, i)
			ACE.playButtons[buttonCounter].onmouseover = displayBlockCall.bind(null, i)
			ACE.playButtons[buttonCounter].style.display = 'block'
			//let top = document.getElementsByClassName('ace_gutter-layer')[0].children[].offsetTop
			//   ^ uhhh, relativeTop?
			ACE.playButtons[buttonCounter].style.top = ((i - start) * ace.renderer.lineHeight) + 'px'
			//if(ace.session.lineWidgets[i]) {
			//  numWidgets++;
			//}
			buttonCounter++
		}
	}
	for(let j = buttonCounter; j < ACE.playCount; j++) {
		ACE.playButtons[j].style.display = 'none'
	}
}


function initLibraries() {
	// automatically load libraries
	let buf = stringToAddress('DEADBEEF') // pointer to pointer
	let length
	if ((length = FS_ReadFile(stringToAddress('driver/library.js'), buf)) > 0 && HEAPU32[buf >> 2] > 0) {
		let imageView = Array.from(HEAPU8.slice(HEAPU32[buf >> 2], HEAPU32[buf >> 2] + length))
		let utfEncoded = imageView.map(function (c) { return String.fromCharCode(c) }).join('')
		FS_FreeFile(HEAPU32[buf >> 2])
		ACE.libraryCode = utfEncoded
		ACE.libraryLines = utfEncoded.split('\n').length
	}

}


function initAce() {
	// TODO: on native sys_open index.html and use engine as proxy, cebsocket
	window.ace = ace.edit('editor')
	ace.setFontSize(16)
	ace.setTheme('ace/theme/monokai')
	ace.session.setTabSize(2)
	ace.session.setMode('ace/mode/javascript')
	ace.session.setUseWorker(false)
	// add play buttons to individual function blocks for ease of use
	ace.on('focus', function () { INPUT.editorActive = true })
	ace.on('blur', function () { INPUT.editorActive = false })
	ace.renderer.on('afterRender', updatePlay)

}



function onError(request) {
	if(request.error.includes('No script')) {
		document.body.classList.remove('runnning')
		document.body.classList.remove('starting')
		document.body.classList.remove('error')
		return
	}

	document.body.classList.remove('running')
	document.body.classList.add('paused')
	if (!ace.session || !ace.session.lineWidgets) {
		return
	}
	let newLines = request.error.replace(/\s*$/, '')
	// if error has a line number, insert message below that line
	let prevLine = processLineNumber(request.line)
	if(!ACE.errorWidget) {
		ACE.errorWidget = createLineWidget(newLines, prevLine, 'morph_error')
		ace.getSession().widgetManager.addLineWidget(ACE.errorWidget)
	} else {
		ACE.errorWidget.el.children[0].innerText = newLines
	}
	ACE.errorWidget.stack = request.stack
}


function onAccessor(request) {
	if(!document.body.className.includes('running')) {
		debugger
	}
	switch(request.accessor) {
		// safe to share?
		case 'window.screenLeft':
		case 'window.screenTop':
		case 'window.outerHeight':
		case 'window.outerWidth':
		let propertyName = request.accessor.split('.')[1]
		window['run-script'].value = window[propertyName]
		break

		default:
		debugger
	}
	window['run-accessor'].click()
}


function onFrontend() {
	window['run-script'].value = ACE.lastRunId
	document.body.classList.add('starting')
	window['run-accessor'].click()
	ACE.downloaded = true
}

function onStarted(request) {
	document.body.classList.remove('paused')
	document.body.classList.remove('starting')
	document.body.classList.add('running')
	ACE.lastRunId = request.started
	window['run-button'].classList.remove('running')
}


let statusWidgets = [

]

function onStatus(request) {
	let prevLine = getLimitedLine(request)

	//if(!ACE.statusLine) {
	//  createLineWidget('.', 0, 'morph_cursor')
	//  ACE.statusLine = ace.session.lineWidgets[0]
	//}

	statusWidgets[prevLine] = Date.now()
}


// this actually started to look pretty decent after I got
//   the engine wired up
function renderCursorLines() {
	if (!ace.session || !ace.session.lineWidgets) {
		return // do nothing, not to interfere with ace
	}

	let textLayer = document.getElementsByClassName('ace_text-layer')[0]
	if(!textLayer) {
		return
	}

	let start = ace.renderer.layerConfig.firstRow
	let count = ace.renderer.layerConfig.lastRow - start
	//let numWidgets = 0
	for(let i = start; i < start + count; i++) {
		// DO CURSOR LINES
		// always update line colors
		if(i - start < textLayer.children.length) {
			let referenceRow = textLayer.children[i - start]
			if(statusWidgets[i] 
				&& Date.now() - statusWidgets[i] < FADE_DURATION + FLASH_DURATION) {
				if(referenceRow.classList.contains('morph_error')) {
					debugger
				}
				if(!referenceRow.classList.contains('morph_cursor'))
					referenceRow.classList.add('morph_cursor')
			} else {
				if(referenceRow.classList.contains('morph_cursor'))
					referenceRow.classList.remove('morph_cursor')
			}
		}
	}


}



// TODO: !!!!!!!!!!!!!!! This is one of those dangerous consequential leaves
//   That should really have extensive library testing in a miriad of existing 
//   projects to test against, but alas, I'm only one
let previousTime = 0
// TODO: 10FPS for text editor? Replace with engine renderer and entities for files/flying
function Ace_Frame() {
	try {
		let now = Date.now()
		if(now - previousTime > 100) {
			renderCursorLines()
		}

	} catch (e) {
		debugger
	}
}


function getLimitedLine(request) {
	let prevLine = request.line
	if(!ACE.libraryLoaded) {
		prevLine -= ACE.libraryLines
	} else {
		prevLine--;
	}
	ACE.cursorLine = prevLine
	if(prevLine >= 0) {
		ACE.currentLine = prevLine
	}

	return prevLine
}


function onAssign(request) {
	let prevLine = getLimitedLine(request)
	// TODO: status line always out of view because sleep is in library.js
	if(prevLine < 0) {
		return // don't load status line while it's out of view
	}
	let prevLineWidgets = ace.getSession().widgetManager.getWidgetsAtRow(prevLine)
	if(!prevLineWidgets.length) {
		let newWidget = createLineWidget((request.assign || '').replace(/\s*$/, ''), prevLine, 'morph_assign')
		ace.getSession().widgetManager.addLineWidget(newWidget)
		newWidget.flashTime = Date.now()
	} else {
		// update existing assignment line
		prevLineWidgets[0].el.children[0].innerText = (request.assign || '').replace(/\s*$/, '')
		prevLineWidgets[0].flashTime = Date.now()
	}
	// sometimes assignments can update a lot
	// TODO: make a way to turn this off
}


function onConsole(request) {
	if (!ace.session || !ace.session.lineWidgets) {
		return
	}
	let newLines = request.console.replace(/\s*$/, '') // only truncating end line Chrome
																								// see, I do have some nice things to say
	let prevLine = ACE.lastLine - (ACE.libraryLoaded ? 1 : ACE.libraryLines)
	if(!ACE.consoleWidget) {
		ACE.consoleWidget = createLineWidget(newLines, prevLine)
		ace.getSession().widgetManager.addLineWidget(ACE.consoleWidget)
	} else {
		ACE.consoleWidget.el.children[0].innerText += '\n' + newLines
	}
	ACE.consoleLines += newLines.split('\n').length
	ACE.consoleWidget.pixelHeight = ace.renderer.lineHeight * ACE.consoleLines
}


window.addEventListener('message', function (message) {
	let request = message.data
	// never download if we get a response from extension
	ACE.downloaded = true
	let requestType = Object.keys(request).filter(function (k) { return k != 'line' && k != 'stack' })[0]
	if(requestType) {
		document.body.classList.add(requestType)
	}

	if(typeof request.accessor != 'undefined') {
		onAccessor(request)
	} else 
	if(typeof request.service != 'undefined') {
		debugger
	} else 
	if(typeof request.frontend != 'undefined') {
		onFrontend()
	} else
	if(typeof request.started != 'undefined') {
		onStarted(request)
	} else


	// the rest of these are console messages
	if(typeof request.warning != 'undefined') {
		processResponse(request.warning, request.line, false)
	} else
	if(typeof request.console != 'undefined') {
		onConsole(request)
	} else 
	if(typeof request.error != 'undefined') {
		onError(request)
	} else 
	if(typeof request.result != 'undefined') {
		document.body.classList.remove('running')
		document.body.classList.add('paused')
		processResponse(request.result, request.line, false)
	} else 
	if(typeof request.status != 'undefined') {
		onStatus(request)
	} else 
	if(typeof request.assign != 'undefined') {
		onAssign(request)
	} else {
		debugger
	}
}, false)
