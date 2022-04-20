
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

function newPlay() {
	let newButton = document.createElement('BUTTON')
	newButton.className += ' run-button small '
	document.body.appendChild(newButton)
	ACE.playButtons.push(newButton)
	++ACE.playCount
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

function runAccessor() {
	// TODO: some error checking?
}


function runBlock(start) {
	if(document.body.className.includes('running')
		|| document.body.className.includes('starting')
		|| document.body.className.includes('paused')) {
		window['run-script'].value 
				= '"' + (ACE.lastRunId || '') + '"'
		ace.focus()
		return
	}

	document.body.classList.add('starting')
	if(!ACE.downloaded) {
		let cancelDownload = setTimeout(emitDownload, 3000)
		if(chrome && chrome.runtime) {
			chrome.runtime.sendMessage(
				EXTENSION_ID, EXTENSION_VERSION, 
				function () { clearTimeout(cancelDownload) })
		}
	}

	if(!ACE.libraryCode) {
		initLibraries()
	}

	if(start == -1) {
		let value = window.ace.getValue()
		window['run-script'].value = 
			// because library inserted into page on error
			(!ACE.libraryLoaded ? ACE.libraryCode : '')
			+ value.replace(/\s*$/, '') + '\nreturn main();'
		ACE.lastLine = ACE.libraryLines + ace.session.getLength()
			- getEmptyLines(value)
	} else {
		let funcName = NAMED_FUNCTION.exec(ace.env.document.getLine(start))[1]
		ACE.lastLine = ACE.libraryLines + ace.session.getFoldWidgetRange(start).end.row
		window['run-script'].value = 
			(!ACE.libraryLoaded ? ACE.libraryCode : '')
			+ ace.session.getLines(start, ACE.lastLine).join('\n').replace(/\s*$/, '')
			+ '\nreturn ' + funcName + '();\n'
	}
	ace.focus()
}



async function emitDownload() {
	if(!document.body.className.includes('starting')) {
		return 
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

function getEmptyLines(value) {
	return value.match(/\s*$/)[0].split('\n').length
}


// let ACE = {}
function anyParentsCollapsed(segments) {
	if(!ACE.filescollapsed) {
		return
	}
	return segments.slice(0, -1)
		.reduce(function (p, s, i) { 
			return p + ACE.filescollapsed[
				segments.slice(0, i + 1).join('/')]
		}, 0)
}

function updateFilelist(filepath) {
	if(!ACE.fileList) {
		ACE.fileList = document.getElementById('file-list')
	}
	if(!ACE.fileList) {
		return
	}
	if(!ACE.filetypes) {
		ACE.filetypes = {}
	}

	let newFiles = Object.keys(FS.virtual)
	let startLength = newFiles.length

	// put folder collapse hidden at top
	for(let i = 0; i < startLength; i++) {
		let segments = newFiles[i].split('/')
			.map(function (seg, i, arr) {
				return arr.slice(0, i + 1).join('/') 
			})
		// ADD MISSING PATHS FROM ENGINE TO FILE 
		//   LIST SO WE DON'T LOSE FILES IN DATABASE
		//   FROM MISSING LINKS. TODO: FSCHKDSK TOOL, WTF?
		newFiles.push.apply(newFiles, segments)
	}

	// sort and unique
	newFiles = newFiles.sort().filter(function (f, i, arr) { 
		return f && arr.indexOf(f) == i
	})

	if(ACE.fileslist) {
		let prevCollapse = ACE.filescollapsed
		// save expand/collapse state even if files are added or removed
		ACE.filescollapsed = newFiles.reduce(function (obj, i) {
			obj[i] = prevCollapse[i]
			// MAINTAIN THIS VISIBILITY INDEX SO USER 
			//   INTERACTION CAN BE VERY SPECIFIC AND FAST
			ACE.filesvisible[i] = obj[i] 
					|| !anyParentsCollapsed(i.split('/'))
			return obj
		}, {})
	} else {
		ACE.filesvisible = {} // I CAN DO THIS ALL DAY
		//   TODO: CHECK V8 USES HASH TABLES OR IF PHP IS FASTER
		ACE.filescollapsed = 
		newFiles.reduce(function (obj, i) {
			obj[i] = i.split('/').length > 1 ? 0 : 1
			ACE.filesvisible[i] = obj[i]
			return obj
		}, {})
	}
	ACE.fileslist = newFiles
	ACE.filescount = Object.values(ACE.filesvisible)
			.reduce(function (p, i) { return p + i }, 0)
	ACE.filesmoved = true
}

function isDirectory(i) {
	// only folder paths and directories are collapsible,
	//   missing paths added seperately above
	//   HENCE THE CHECK FOR !FS.virtual[files[j]]
	return !FS.virtual[i] || FS.virtual[i].mode == FS_DIR
}

function toggleCollapse(row, dataRow) {
	let collapse = !ACE.filescollapsed[dataRow]
	for(let i = row; i < ACE.fileslist.length; i++) {
		if(ACE.fileslist[i].substring(0, dataRow.length)
			.localeCompare(dataRow)) {
			break // no more files under this sorted folder
		}
		// don't make the row we clicked on invisible
		if(ACE.fileslist[i] !== dataRow) {
			ACE.filesvisible[ACE.fileslist[i]] = !collapse
		}
		if(!collapse) {
			ACE.filescount++
		} else {
			ACE.filescount--
		}
	}
	ACE.filescollapsed[dataRow] = collapse
	ACE.filesmoved = true
}



function doFileClick(evt) {
	if(!evt.target) {
		return
	}
  let gamedir = addressToString(FS_GetCurrentGameDir())
	let row = evt.target.getAttribute('aria-id') // WTF?
	let dataRow = ACE.fileslist[row]
	if(FS.virtual[dataRow]
		&& FS.virtual[dataRow].mode != FS_DIR) {
		Cbuf_AddText(stringToAddress(
				'edit "' + dataRow.replace(gamedir + '/', '') + '"\n'))
		return
	}
	toggleCollapse(row, dataRow)
}



// DO THE SAME KIND OF VIRTUAL RENDERING TECHNIQUE ACE USES ON CODE,
//   AND APPLY IT TO THE FILE LIST IN CASE THERE'S EVER LIKE, 10,000
//   THAT MIGHT BE TOO MUCH FOR A PAGE. BOOKMARKS, FOR EXAMPLE?
// TODO: FANCY STUFF LIKE VS CODE EXTENSIONS LIST, GITHUB ACTIONS LEFT HAND LIST,
//   SHOW FILE-GHOST TARGETS BEFORE MAKEFILE CREATES THEM USING SYNTAX ANALYSIS
//   LIKE MACOS DOES IN FINDER WHEN YOU GO TO COPY A FILE OR SOMETHING IS 
//   UPLOADING TO ICLOUD.
function renderFilelist() {
	if(!ACE.fileList) {
		updateFilelist()
		if(!ACE.fileList) {
			return
		}
	}

	// GENERATE THIS LIST ON BACKEND USING VIRTUAL DOM, CSS CONTROL OVER LIST WILL
	//   LOOK THE SAME
	let actualList = ACE.fileList.getElementsByTagName('ol')[0]
	if(!actualList) {
		return
	}
	let newHeight = ACE.filescount * ace.renderer.lineHeight
	if(actualList.clientHeight != newHeight)
		actualList.style.height = newHeight + 'px'

	let virtualLineCount = Math.min(Math.ceil(
		ACE.fileList.clientHeight / ace.renderer.lineHeight)
				, ACE.filescount) // min, updated on interaction

	// THIS IS WRONG, STARTING ON VISIBLE LINES LIST
	//   NOT ALL OF FILES. BUT WAIT, IF THEY SCROLLED IT
	//   CERTAINLY CAN'T DISPLAY LINES BEFORE THEIR SCROLL
	//   EVEN IF THEY ARE COLLAPSED OR NOT.
	let startLine = Math.floor(
		ACE.fileList.scrollTop / ace.renderer.lineHeight)
	let displayCount = 0

	for(
		let j = startLine; // small efficiency gain?
		displayCount < virtualLineCount && j < ACE.fileslist.length;
		j++
	) {
		if(!ACE.filesvisible[ACE.fileslist[j]]) {
			continue
		}
		// SWITCHING BETWEEN IDE AND SOURCE TREE TO COPY SHIT CODE I 
		//   WROTE LAST NIGHT. I REALIZED VS CODE DOES THIS BLAME FEATURE
		//   BUT IT'S DISTRACTING, BOTH VIEWS OF CHANGES ARE SMALL AND 
		//   INCONVENIENT, BEYOND COMPARE IS BEYOND COMPARE. WHAT IF THERE
		//   WAS A TAB AT THE TOP I COULD SWITCH TO, TO SEE SOURCE COMPARE?
		let item
		let link

		if(displayCount == actualList.children.length) {
			item = document.createElement('LI')
			actualList.appendChild(item)
			link = document.createElement('A')
			link.onclick = doFileClick
			item.appendChild(link)
		} else {
			item = actualList.children[displayCount]
			link = item.children[0]
		}
		// TODO: SHOW SEPERATED DIRECTORIES IN ONE LINE LIKE VISUAL STUDIO CODE DOES
		//   GITHUB ALSO DOES IT FOR FOLDERS THAT ONLY HAVE 1 PATH
		if(ACE.filesmoved) {
			let segments = ACE.fileslist[j].split('/')
			link.setAttribute('aria-id', j) // WTF WAS THIS CRAP???
			link.innerText = segments.slice(-1)[0]
			link.style.paddingLeft = (segments.length * 20 + 20) + 'px'
			link.style.backgroundPosition = ((segments.length - 1) * 20 + 10) + 'px 50%'
			if(isDirectory(ACE.fileslist[j])) {
				if(item.className != 'folder')
					item.className = 'folder'
			} else {
				if(item.className != 'file')
					item.className = 'file'
			}
			item.style.display = 'block'
		}
		displayCount++
	}
	if(ACE.filesmoved) {
		for(let i = displayCount; i < actualList.children.length; i++) {
			actualList.children[i].style.display = 'none'
		}
	}
	ACE.filesmoved = false
}


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



function onError(request) {
	if(request.error.includes('No script')) {
		document.body.classList.remove('runnning')
		document.body.classList.remove('starting')
		document.body.classList.remove('error')
		return
	}

	document.body.classList.remove('running')
	document.body.classList.add('stopped')
	// SEARCH GITHUB: getElementsByClassName('.
	//   WHAT IF MY BOT COULD DEBUG OTHER PEOPLE'S CODE
	//   WHILE THEY ARE SLEEP LIKE THE SANDMAN?
	let dialogs = document.getElementsByClassName('dialog')
	for(let i = 0; i < dialogs.length; i++) {
		dialogs[i].style.display = 'none'
		if(dialogs[i].timeout) {
			clearTimeout(dialogs[i].timeout)
		}
	}
	if (!ace.session) {
		return
	}
	if(!ace.session.lineWidgets) {
		initLineWidgets()
	}
	let newLines = request.error.replace(/\s*$/, '')
	// if error has a line number, insert message below that line
	let prevLine = processLineNumber(request.line < 0 ? 0 : request.line)
	if(!ACE.errorWidget) {
		ACE.errorWidget = createLineWidget(newLines, prevLine, 'morph_error')
		ace.getSession().widgetManager.addLineWidget(ACE.errorWidget)
	} else {
		ACE.errorWidget.el.children[0].innerText = newLines
	}
	if(typeof request.locals != 'undefined') {
		let lines = Object.keys(request.locals)
		for(let j = 0; j < lines.length; j++) {
			onAssign({
				assign: request.locals[lines[j]],
				line: lines[j],
			})
		}
	}
	ACE.errorWidget.stack = request.stack
}


function collectForm(dialog) {
	let formResults = {}
	let formField = dialog.getElementsByTagName('form')[0]
	if(!formField) {
		window['run-script'].value = ''
		clearTimeout(dialog.timeout)
		return
	}
	for(let i = 0; i < formField.children.length; i++) {
		if(formField.children[i].tagName == 'INPUT') {
			formResults[formField.children[i].id] = formField.children[i].value
		} else
		if(formField.children[i].tagName == 'BUTTON'
			&& formField.children[i] == this) {
				// BACK IN THE DAY, PROGRAMMING IN PHP, REMEMBER
				//   DETECTING THE SUBMIT BUTTON THAT WAS PRESSED
				//   FOR MULTI-ACTION FORMS, SIMULATE THAT SENSATION HERE
				formResults[formField.children[i].id] = true
		}
	}
	window['run-script'].value = JSON.stringify(formResults)
	clearTimeout(dialog.timeout)
}



function createDialog(request) {
	newDialog = document.createElement('DIV')
	newDialog.className = 'dialog'
	document.body.appendChild(newDialog)

	// INTERESTING, THIS NEIGHBOR WAS TALKING ABOUT CHANGING
	//   NAMES AND PASSING VAIRABLES AROUND AND MAKING MESS,
	//   HE UNDID THE MESS AND THE WHOLE SYSTEM RUNS FASTERS.
	if(request.accessor) {
		newDialog.id = request.accessor
		// ^ WAY MORE OBVIOUS, BETTER FOR SEARCHES
		//newDialog.id = 'enter-login'
	}

	// dialog uses first DIV for background and first
	//   child element for the window box.
	if(request.form) {
		newDialog.appendChild(document.createElement('FORM'))
	} else {
		newDialog.appendChild(document.createElement('DIV'))
	}

	if(request.title) {
		let newTitle = document.createElement('H2')
		newTitle.innerText = request.title
		newDialog.children[0].appendChild(newTitle)
	}

	if(request.text) {
		let lines = request.text.split('\n')
		for(let j = 0; j < lines.length; j++) {
			if(j == lines.length - 1 
				&& lines[j].trim().length == 0) {
				break
			}
			let newLine = document.createElement('SPAN')
			newLine.innerText = request.text
			newDialog.children[0].appendChild(newLine)
			newDialog.children[0].appendChild(document.createElement('BR'))
		}
	}

	if (!request.form) {
		return newDialog
	}

	let fields = Object.keys(request.form)
	for(let i = 0; i < fields.length; i++) {
		let field = request.form[fields[i]]
		let newField
		let newLabel
		if(field.startsWith('radio')) {
			newLabel = document.createElement('LABEL')
			newLabel.for = fields[i]
			newLabel.innerText = fields[i]
			newField = document.createElement('INPUT')
			newField.type = 'radio'
			newField.name = field // TO MAKE GROUPS BY NAME
			newField.id = fields[i]
			newDialog.children[0].appendChild(newField)
			newDialog.children[0].appendChild(
				document.createElement('BR'))
		} else
		if(field == 'text') {
			newLabel = document.createElement('LABEL')
			newLabel.for = fields[i]
			newLabel.innerText = fields[i] + ': '
			newDialog.children[0].appendChild(newLabel)
			newField = document.createElement('INPUT')
			newField.type = 'text'
			newField.id = fields[i]
			newDialog.children[0].appendChild(newField)
			newDialog.children[0].appendChild(
				document.createElement('BR'))
		} else
		if(field == 'pass') {
			newLabel = document.createElement('LABEL')
			newLabel.for = fields[i]
			newLabel.innerText = fields[i] + ': '
			newDialog.children[0].appendChild(newLabel)
			newField = document.createElement('INPUT')
			newField.type = 'password'
			newField.id = fields[i]
			newDialog.children[0].appendChild(newField)
			newDialog.children[0].appendChild(
				document.createElement('BR'))
		} else
		if(field == 'submit') {
			newField = document.createElement('BUTTON')
			newField.type = 'submit'
			newField.onclick = collectForm.bind(newField, newDialog)
			newField.className = 'run-accessor'
			newField.id = fields[i]
			newField.innerText = fields[i]
			newDialog.children[0].appendChild(newField)
		} else {
			continue
		}
	}

	return newDialog
}



// WHY DO THIS DIALOG FORM CRAP? HASN'T THIS BEEN DONE 1000X OVER
//   BY WORDPRESS? IN THIS CASE, THERE'S A SPECIFIC PURPOSE.
//   IN CASE A MORPHEUS SCRIPT NEEDS INTERVENTION LIKE CAPTCHA
//   WE CAN PHARM OUT THE CAPTCHA FORMS USING A STANDARD UI
//   NO ONE WILL KNOW IF THEY ARE ENTERING A CAPTCHA FOR THEIR
//   OWN LOGIN, OR IF THEY ENTERED IT WRONG AND ARE ENTERING 
//   SOMEONE ELSE'S CAPTCHA BECAUSE THEY AREN'T PRESENT, ATM.
//   RECAPTCHA WAS A STUPID SOLUTION, WE SHOULD HAVE MADE BOT-
//   NETS PUBLIC AND VOLNUTEER A LONG TIME AGO. MY INDUSTRY
//   HAS FAILED TO CAPITALIZE.
// TODO: BRING BACK EULA FOR QUAKE 3 DEMO FOR PUBLIC RELEASE
//   THAT WAY THEY HAVE TO ENTER A KEY TO PLAY THE WHOLE GAME
//   I CAN'T BE ACCUSED OF STEALING IF IT'S THE DEMO PRESENTED
//   WITH THE SAME AGREEMENT AS ON DESKTOP. I THOUGHT THERE WAS
//   AND IN GAME Y/N KEY FOR ACCEPTING EULA? CHECK FOR EULA.TXT
// TODO: call this code for engine system errors Sys_Dialog()
// TODO: NOT REALLY SURE HOW CHROME PROTECTS PASSWORDS AGAINST
//   MEMORY ATTACKS
function doDialog(request, newDialog) {
	let skipCreate = false
	if(!newDialog) {
		newDialog = createDialog(request)
	} else {
		skipCreate = true
	}

	// create a drop surface since the game 
	//    and editor might interfere
	newDialog.style.display = 'block'
	// no await? don't want to lock up main thread
	if(newDialog.timeout) {
		clearTimeout(newDialog.timeout)
	}
	// IMPORTANT: prevents inputs from display in game
	INPUT.editorActive = true
	newDialog.timeout = setTimeout(function () {
		window['run-script'].value = ''
		window['run-accessor'].click()
		// circle back around so server can always control dialog
		newDialog.timeout = setTimeout(function () {
			newDialog.style.display = 'none'
		}, 1000)
	}, 2000)
	// async skip click
	return newDialog
}


function onAccessor(request) {
	if(!document.body.className.includes('running')
		// because pause it allowed to happen mid flight finish the accessor request
		&& !document.body.className.includes('paused')
		// plus a side effect, we might use accessors in debugging
	) {
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
		window['run-accessor'].click()
		return
		case '_morpheusKey':
			ACE.dropFile = doDialog(request, ACE.dropFile)
		return
		case '_enterLogin':
			ACE.enterPassword = doDialog(request, ACE.enterPassword)
		return

		default:
		debugger
	}
}


function onFrontend() {
	window['run-script'].value = '"' + (ACE.lastRunId || '') + '"'
	document.body.classList.add('starting')
	window['run-accessor'].click()
	ACE.downloaded = true
}

function onStarted(request) {
	document.body.classList.remove('stopped')
	document.body.classList.remove('paused')
	document.body.classList.remove('starting')
	document.body.classList.add('running')
	ACE.lastRunId = request.started
	if(!ACE.lastRunId) {
		throw new Error('goddamnit')
	}
	window['run-button'].classList.remove('running')
}


let statusWidgets = [

]

function onStatus(request) {
	let prevLine = getLimitedLine(request.line)

	//if(!ACE.statusLine) {
	//  createLineWidget('.', 0, 'morph_cursor')
	//  ACE.statusLine = ace.session.lineWidgets[0]
	//}
	if(request.line >= ACE.libraryLines) {
		ACE.previousNonLibrary = prevLine
	} else {
		ACE.previousLine = request.line
	}

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


function getLimitedLine(prevLine) {
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
	let prevLine = getLimitedLine(request.line)
	// TODO: status line always out of view because sleep is in library.js
	if(prevLine < 0) {
		return // don't load status line while it's out of view
	}
	
	if (!ace.session || !ace.session.lineWidgets) {
		initLineWidgets()
	}
	
	let prevLineWidgets = ace.getSession().widgetManager.getWidgetsAtRow(prevLine)
	// look for existing assign widget
	let found = false
	let i = 0
	for(; i < prevLineWidgets.length; i++) {
		if(prevLineWidgets[i].el.className.includes('morph_assign')) {
			found = true
			break
		}
	}
	if(!found) {
		let newWidget = createLineWidget((request.assign || '').replace(/\s*$/, ''), prevLine, 'morph_assign')
		ace.getSession().widgetManager.addLineWidget(newWidget)
		newWidget.flashTime = Date.now()
	} else {
		// update existing assignment line
		prevLineWidgets[i].el.children[0].innerText = (request.assign || '').replace(/\s*$/, '')
		prevLineWidgets[i].flashTime = Date.now()
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
		ACE.consoleWidget = createLineWidget(newLines + '\n', prevLine)
		ace.getSession().widgetManager.addLineWidget(ACE.consoleWidget)
	} else {
		ACE.consoleWidget.el.children[0].innerText += newLines + '\n'
	}
	ACE.consoleLines += newLines.split('\n').length
	ACE.consoleWidget.pixelHeight = ace.renderer.lineHeight * ACE.consoleLines
}


function onPaused(request) {
	//let prevLine = getLimitedLine(request.line)
	//if(prevLine < 0) {
	//	return // don't load status line while it's out of view
	//}
	document.body.classList.remove('starting')
	document.body.classList.add('paused')
	if(!ACE.pausedWidget) {
		if(!ACE.libraryLoaded) {
			ACE.pausedWidget = createLineWidget('PAUSED', ACE.previousNonLibrary, 'morph_pause')
		} else {
			ACE.pausedWidget = createLineWidget('PAUSED', ACE.previousLine, 'morph_pause')
		}
		ace.getSession().widgetManager.addLineWidget(ACE.pausedWidget)
	} else {
		if(!ACE.libraryLoaded) {
			ACE.pausedWidget.row = ACE.previousNonLibrary
		} else {
			ACE.pausedWidget.row = ACE.previousLine
		}
		//ace.getSession().widgetManager.addLineWidget(ACE.pausedWidget)
	}
	// debounce
	setTimeout(function () {
		document.body.classList.remove('running')
	}, 1000)
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
	if(typeof request.paused != 'undefined') {
		onPaused(request)
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
		document.body.classList.add('stopped')
		processResponse(request.result, request.line, false)
	} else 
	if(typeof request.async != 'undefined') {
		// async notifications are like halfway between result and started
		request.started = request.async
		onStarted(request)
	} else 
	if(typeof request.status != 'undefined') {
		onStatus(request)
	} else 
	if(typeof request.assign != 'undefined') {
		onAssign(request)
	} else 
	if(typeof request.stopped != 'undefined') {
		document.body.classList.remove('paused')
		document.body.classList.remove('running')
		document.body.classList.remove('starting')

	} else {
		debugger
	}
}, false)



// SOURCE: https://stackoverflow.com/questions/18279141/javascript-string-encryption-and-decryption

const crypt = (salt, text) => {
  const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
  const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
  const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);

  return text
    .split("")
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join("");
};

const decrypt = (salt, encoded) => {
  const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
  const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
  return encoded
    .match(/.{1,2}/g)
    .map((hex) => parseInt(hex, 16))
    .map(applySaltToChar)
    .map((charCode) => String.fromCharCode(charCode))
    .join("");
};


