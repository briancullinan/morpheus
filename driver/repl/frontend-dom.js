
function runAccessor() {
	// TODO: some error checking?
	return false
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

let statusWidgets = [

]

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

function doStatus(request) {
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


function doAccessor(request) {
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



function doError(request) {
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
			doAssign({
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


function doAssign(request) {
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


function doConsole(request) {
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


function onMessage(message) {
  let request = message.data
	// never download if we get a response from extension
	ACE.downloaded = true
	let requestType = Object.keys(request).filter(function (k) { return k != 'line' && k != 'stack' })[0]
	if(requestType) {
		document.body.classList.add(requestType)
	}

	if(typeof request.accessor != 'undefined') {
		doAccessor(request)
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
		doConsole(request)
	} else 
	if(typeof request.error != 'undefined') {
		doError(request)
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
		doStatus(request)
	} else 
	if(typeof request.assign != 'undefined') {
		doAssign(request)
	} else 
	if(typeof request.stopped != 'undefined') {
		document.body.classList.remove('paused')
		document.body.classList.remove('running')
		document.body.classList.remove('starting')

	} else {
		debugger
	}
}


/*
navigator.serviceWorker.register('blob:...', {
	updateUrl: '/sw.js'
})
*/

window.addEventListener('message', onMessage, false)


