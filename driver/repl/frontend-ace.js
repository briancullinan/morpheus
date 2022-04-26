
let ACE = {
	consoleLines: 0,
	lastRunId: null,
	playCount: 0,
	playButtons: [],
	downloaded: false,
	filename: false,

	// THIS GIVES US THAT FEATURE LIKE VISUAL STUDIO WITH THE HIDDEN IMPORTS IN
	//   PROJECT SETTINGS, I THINK ECLIPSE/JAVA DOES THIS TOO.
	libraryCode: '',
	libraryLines: 0,
	libraryLoaded: false,
}

const NAMED_FUNCTION = /function\s+([a-z]+[ -~]*)\s*\(/
const EXTENSION_ID = 'lnglmljjcpnpahmfpnfjkgjgmjhegihd';
const EXTENSION_VERSION = '1.0'
const RGBA_REGEX = /rgba?\(([^\)]*)\)/
const FADE_DURATION = 300.0
const FLASH_DURATION = 700.0

function initAce() {
	// TODO: on native sys_open index.html and use engine as proxy, cebsocket
	window.ace = ace.edit('editor')
	ace.setFontSize(16)
	ace.setTheme('ace/theme/monokai')
	ace.setOption('minLines', 1000)
	ace.setOption('foldStyle', 'markbeginend')
	ace.setOption('fadeFoldWidgets', true)
	ace.setOption('scrollPastEnd', 0.618) // FOR TERRY!!!
	ace.setOption('wrap', 50)
	ace.setOption('printMarginColumn', 50)
	//ace.setOption('split', 'below')
	ace.setOption('indentedSoftWrap', false)
	ace.session.setTabSize(2)
	ace.session.setMode('ace/mode/javascript')
	ace.session.setUseWorker(false)
	// add play buttons to individual function blocks for ease of use
	ace.on('focus', function () { INPUT.editorActive = true })
	ace.on('blur', function () { INPUT.editorActive = false })

}

// MAYBE A FUCKING WARNING HERE LIKE CALL STACK EXCEEDED?
//   HOW ABOUT "FOR LOOP LENGTH EXCEEDED"? FUCKING AMAZING HOW AWFUL 
//   PROGRAMMING IS, NO WONDER THERE'S BUGS
// for(let i = 0; i < ace.session.lineWidgets.length; ++i) {
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


function processLineNumber(lineNumber) {
	let prevLine = lineNumber
	if(!lineNumber) { // startup error message?
		return lineNumber
	}
	// if the error occurs on a line inside the library
	let widgetManager = ace.getSession().widgetManager
	if(prevLine < ACE.libraryLines && !ACE.libraryLoaded) {
		ACE.libraryLoaded = true
		let previousLength = ace.session.getLength()
		let previousWidgets = []
		for(let i = 0; i < previousLength; ++i) {
			let oldWidgets = widgetManager.getWidgetsAtRow(i)
			oldWidgets.forEach(function (w) { 
				previousWidgets[i] = w
				widgetManager.removeLineWidget(w) 
			})
		}

		let libraryCombinedCode = ACE.libraryCode 
				+ ace.getValue()
		ace.setValue(libraryCombinedCode)


		// TODO:  ?????????
		statusWidgets = []


		// Add widgets back in to new line
		for(let i = 0; i < previousLength; ++i) {
			if(!previousWidgets[i]) {
				continue
			}
			let newLine = previousWidgets[i].row 
					+ ACE.libraryLines - 1
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

	// scroll to the line when an error occurs
	if(ace.gotoLine) {
		setTimeout(ace.gotoLine.bind(ace, prevLine), 100)
	}
	return prevLine
}


function processResponse(updateText, lineNumber, error) {
	if (!ace.session || !ace.session.lineWidgets) {
		return
	}

	// TODO: display some fancy report?
	
}


function newPlay() {
	let newButton = document.createElement('BUTTON')
	newButton.className += ' run-button small '
	document.body.appendChild(newButton)
	ACE.playButtons.push(newButton)
	++ACE.playCount
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
	if (!ace.session || !ace.session.lineWidgets) {
		return
	}
	let buttonCounter = 0
	let start = ace.renderer.layerConfig.firstRow
	let count = ace.renderer.layerConfig.lastRow - start
	//let numWidgets = 0
	for(let i = start; i < start + count; ++i) {
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
			++buttonCounter
		}
	}
	for(let j = buttonCounter; j < ACE.playCount; ++j) {
		ACE.playButtons[j].style.display = 'none'
	}
}


function initLibraries() {
	// automatically load libraries
	let buf = stringToAddress('DEADBEEF') // pointer to pointer
	let length
	if ((length = FS_ReadFile(stringToAddress('driver/library.js'), buf)) 
			> 0 && HEAPU32[buf >> 2] > 0
	) {
		let imageView = Array.from(HEAPU8.slice(HEAPU32[buf >> 2], HEAPU32[buf >> 2] + length))
		let utfEncoded = imageView.map(function (c) { return String.fromCharCode(c) }).join('')
		FS_FreeFile(HEAPU32[buf >> 2])
		ACE.libraryCode = utfEncoded
		ACE.libraryLines = utfEncoded.split('\n').length
	}

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
	for(let i = start; i < start + count; ++i) {
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

		if(ace.session.lineWidgets[i]) {
			if(ace.session.lineWidgets[i].flashTime) {
				let referenceRow = ace.session.lineWidgets[i].el
				if(Date.now() - ace.session.lineWidgets[i].flashTime < FADE_DURATION + FLASH_DURATION) {
					if(referenceRow.classList.contains('morph_flash'))
						referenceRow.classList.remove('morph_flash')
				} else {
					// add flash to switch off
					if(!referenceRow.classList.contains('morph_flash'))
						referenceRow.classList.add('morph_flash')
				}
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
			if(ACE.fileList && ACE.fileList.style.display != 'none') {
				renderFilelist()
			}
		}

	} catch (e) {
		debugger
	}
}



