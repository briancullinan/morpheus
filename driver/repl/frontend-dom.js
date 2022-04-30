
function runAccessor() {
	// TODO: some error checking?
	return false
}


function runBlock(start) {
	if(document.body.className.includes('running')
		|| document.body.className.includes('starting')
		|| document.body.className.includes('paused')) {
		ace.focus()
		return
	}

	document.body.classList.add('starting')
	// maybe we don't have the plugin
	if(!ACE.downloaded && document.body.className.includes('starting')) {
		let cancelDownload = setTimeout(emitDownload, 3000)
		if(chrome && chrome.runtime) {
			chrome.runtime.sendMessage(
				EXTENSION_ID, EXTENSION_VERSION, 
			function () {
				clearTimeout(cancelDownload)
			})
		}
	}

	if(start == -1) {
		let value = window.ace.getValue()
		window['run-script'].value 
				= value.replace(/\s*$/, '') + '\nreturn main();'
		ACE.lastLine = ace.session.getLength()
	} else {
		let funcName = NAMED_FUNCTION.exec(ace.env.document.getLine(start))[1]
		ACE.lastLine = ace.session.getFoldWidgetRange(start).end.row
		window['run-script'].value 
			= ace.session.getLines(start, ACE.lastLine)
				.join('\n').replace(/\s*$/, '') 
				+ '\nreturn ' + funcName + '();\n'
	}
	ace.focus()
}



function doStatus(request) {
	if(!ACE.statusWidgets) {
		ACE.statusWidgets = []
	}
	if(request.status) {
		ACE.threadPool = JSON.parse(request.status)
	}
	// https://www.youtube.com/watch?v=tvguv-lvq3k - Bassnectar - The Matrix (ft. D.U.S.T.)
	// TODO: put another instance of ACE in the status widget
	let previousCall
	if(request.stack
		&& (previousCall = request.stack.pop())) {
		let previousFunction = previousCall.split('.')[0].trim()
		if(!ACE.libraryFunctions) {
			ACE.libraryFunctions = {}
		}
		if(typeof ACE.libraryFunctions[previousFunction] != 'undefined') {
		} else {
			ACE.libraryFunctions[previousFunction] = doLibraryLookup(previousFunction)
		}
		// in-case null means we already searched doLibraryLookup
		// FOR CODE REVIEWS, HOW TO MEASURE PERFORMANCE GAINS BY NOT
		//   REPEATING TASKS JUST FROM LOOKING AT CODE WITH LITTLE UNDERSTANDING?
		if(ACE.libraryFunctions[previousFunction]) {
			// slowly open function without affecting scroll
			if(ACE.libraryFunctions[previousFunction].name == '<eval>') {	
				ACE.statusWidgets[request.line] = Date.now()
				ACE.previousNonLibrary = request.line
			} else {
				ACE.previousLine = request.line || 0
			}
		}
		if(request.stack
			&& (!ACE.callStack 
				|| ACE.callStack.length != request.stack.length)) {
			ACE.callStack = request.stack
		}
	}

	if(!ACE.filestimer) {
		ACE.filestimer = setTimeout(updateFilelist, 100)
	}

}


function doLibraryLookup(functionName) {
	let libraryFiles = Object.keys(FS.virtual)
		.filter(function (p) { return p.includes('/library/') })
	for(let i = 0; i < libraryFiles.length; i++) {
		let libraryCode = Array.from(FS.virtual[libraryFiles[i]].contents)
			.map(function (c) { return String.fromCharCode(c) })
			.join('')
		// TODO: make these tokens instead of function for cross language support
		if(libraryCode.includes('function ' + functionName)) {
			return {
				library: libraryCode,
				name: libraryFiles[i],
				// TODO: a hash value?
			}
		} else {
			let currentSession = window.ace.getValue()
			if (currentSession.includes('function ' + functionName)) {
				return {
					library: currentSession,
					name: '<eval>',
					// TODO: a hash value?
				}
			}
		}
	}
}


function onFrontend(request) {
	document.body.classList.add('starting')
	window['run-script'].value = JSON.stringify({
		responseId: request.responseId
	})
	window['run-accessor'].click()
	ACE.downloaded = true
}

function onStarted(request) {
	document.body.classList.remove('stopped')
	document.body.classList.remove('paused')
	document.body.classList.remove('starting')
	document.body.classList.add('running')
	window['run-button'].classList.remove('running')
	if(request.started) {
		ACE.threadPool = JSON.parse(request.started)
		updateFilelist('Threads')
	}
}


function doAccessor(request) {
	if(!document.body.className.includes('running')
		// because pause it allowed to happen mid flight finish the accessor request
		&& !document.body.className.includes('paused')
		// plus a side effect, we might use accessors in debugging
	) {
		//debugger
	}
	// SINK, encrypt form data directly to remote page, or directly to backend
	//   in case of system password collection, this gurantees the data gets to 
	//   the right page, hopefully without being logged or stolen.
	if(request.sessionId) {
		(function (sess) {
			temporarySessionEncryptor = function (data) {
				return crypt(sess, data)
			}
		})(request.sessionId)
	}
	switch(request.accessor) {
		case '_morpheusKey':
			ACE.dropFile = doDialog(request, ACE.dropFile)
		return
		case '_enterLogin':
			ACE.enterPassword = doDialog(request, ACE.enterPassword)
		return
		default:
			if(request.accessor === false) {
				hideAllDialogs()
				return
			} else
			if(request.accessor.startsWith('exports.')) {
				// TODO: this is where we ask the Language-Server which file 
				//   the symbol is in and figure out if it needs to be translated.
				// for now though, just check driver/library/index.js
				let lib = doLibraryLookup(request.accessor.split('.')[1])
				if(lib) {
					lib.responseId = request.responseId
					window['run-script'].value = JSON.stringify(lib)
				} else {
					window['run-script'].value = JSON.stringify({
						responseId: request.responseId
					})
				}
				window['run-accessor'].click()
				return
			}
		debugger
	}
}


function hideAllDialogs() {
	let dialogs = document.getElementsByClassName('dialog')
	for(let i = 0; i < dialogs.length; i++) {
		dialogs[i].style.display = 'none'
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
	hideAllDialogs()
	// SEARCH GITHUB: getElementsByClassName('.
	//   WHAT IF MY BOT COULD DEBUG OTHER PEOPLE'S CODE
	//   WHILE THEY ARE SLEEP LIKE THE SANDMAN?
	if (!ace.session) {
		return
	}
	if(!ace.session.lineWidgets) {
		initLineWidgets()
	}
	let newLines = request.error.replace(/\s*$/, '')
	// scroll to the line when an error occurs
	if(ace.gotoLine) {
		setTimeout(ace.gotoLine.bind(ace, request.line), 100)
	}
	// if error has a line number, insert message below that line
	if(!ACE.errorWidget) {
		ACE.errorWidget = createLineWidget(newLines, request.line, 'morph_error')
		ace.getSession().widgetManager.addLineWidget(ACE.errorWidget)
	} else {
		ACE.errorWidget.el.children[0].innerText = newLines
	}
	ACE.errorWidget.stack = request.stack
}


function collectForm(dialog) {
	let formResults = {}
	let formField = dialog.getElementsByTagName('form')[0]
	if(!formField) {
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
	return formResults
}


// this is potentially replaced with every page change with an encryption
//   key that is not known to the backend, for collecting a system password
//   the backend generates a temporary key and stores it in a functional
//   context like this one
// while none of this prevents plugins from snooping on passwords, 
//   i'm hoping it prevents logging systems from snooping, or other plugins
//   from snooping on all page messages
// ENCRYPT WITH THE SESSIONID! BECAUSE WE HAVE PREVENTED RUNIDS/SESSIONIDS FROM BEING
//   SENT BACK TO THE CLIENT, 1-WAY FROM FRONTEND-PLUGIN.JS TO BACKEND-PLUGIN.JS
// SESSIONID IS CREATED IN THE CONTEXT OF A SECONDARY/REMOTE BROWSER WINDOW.
//   NEVER STORED IN FRONTEND-PLUGIN.JS, FOR TRANSFERRING FROM PAGE TO PAGE
//   WITHOUT THE BACKEND/SERVER EVER KNOWING THE TRUTH.
let temporarySessionEncryptor




function doSendForm(dialog, event) {
	let formResults
	let responseId = dialog.getAttribute('aria-id')
	if(event.currentTarget === dialog
		|| !(formResults = collectForm(dialog))) {
		hideAllDialogs()
		window['run-script'].value = JSON.stringify({
			responseId: responseId
		})
	} else {
		// SINK!
		let encrypted = temporarySessionEncryptor(JSON.stringify(formResults))
		window['run-script'].value = JSON.stringify({
			responseId: responseId,
			result: { type: 'string', value: encrypted }
		})
	}

	// in case of any other snoopy/loggy plugins
	let waitTime = 100
	if(!document.body.classList.contains('accessor')) {
		// whoops missed the dialog
		waitTime = 300
	}
	setTimeout(function () {
		window['run-accessor'].click()
	}, waitTime)
}


function createDialog(request) {
	newDialog = document.createElement('DIV')
	newDialog.className = 'dialog'
	newDialog.onclick = doSendForm.bind(newDialog, newDialog)
	document.body.appendChild(newDialog)
	// INTERESTING, THIS NEIGHBOR WAS TALKING ABOUT CHANGING
	//   NAMES AND PASSING VAIRABLES AROUND AND MAKING MESS,
	//   HE UNDID THE MESS AND THE WHOLE SYSTEM RUNS FASTER.
	if(request.accessor) {
		newDialog.id = request.accessor
		// ^ WAY MORE OBVIOUS, BETTER FOR SEARCHES
		//newDialog.id = 'enter-login'
	}

	// dialog uses first DIV for background and first
	//   child element for the window box.
	if(request.form) {
		newDialog.appendChild(document.createElement('FORM'))
		newDialog.children[0].action = 'javascript: false;'
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
			newLine.innerText = lines[j]
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
			newLabel.setAttribute('for', fields[i])
			newLabel.innerText = fields[i]
			newField = document.createElement('INPUT')
			newField.type = 'radio'
			newField.name = field // TO MAKE GROUPS BY NAME
			newField.id = fields[i]
			newDialog.children[0].appendChild(newField)
			newDialog.children[0].appendChild(newLabel)
			newDialog.children[0].appendChild(
					document.createElement('BR'))
		} else
		if(field == 'text') {
			newLabel = document.createElement('LABEL')
			newLabel.setAttribute('for', fields[i])
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
			newLabel.setAttribute('for', fields[i])
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
			newField.onclick = doSendForm.bind(newField, newDialog)
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
// TODO: NOT REALLY SURE HOW CHROME PROTECTS PASSWORD FIELDS AGAINST
//   MEMORY ATTACKS
function doDialog(request, newDialog) {
	if(!newDialog) {
		newDialog = createDialog(request)
	}
	// can change titles on a dialog for reusability
	if(request.title
		&& newDialog.children[0].children[0].nodeName == 'H2') {
		newDialog.children[0].children[0].innerText = request.title
	}
	newDialog.setAttribute('aria-id', request.responseId)
	// create a drop surface since the game 
	//   and editor might interfere
	newDialog.style.display = 'block'

	// IMPORTANT: prevents inputs from display in game
	INPUT.editorActive = true
	let input = newDialog.getElementsByTagName('input')[0]
	if(!input) {
		input = newDialog.getElementsByTagName('button')[0]
	}
	if(input) {
		input.focus()
	}
	// no await? don't want to lock up main thread
	// TODO: debounce the dialog a little so scripts can
	//   run and get an answer, or continue without an answer
	// but leave dialog open in case prompted again
	// circle back around so server can always control dialog
	//   if we don't get a response within 400ms close the dialog
	// async skip click
	return newDialog
}



// I NEED AN EASY WIN, LIKE A WARMUP TASK.
function toggleOption(option) {
	switch(option.id) {
		case 'syncLocal':
			
			break
		case 'snapWindows':
			break
			// GOOGLE HIDES THEIR CONSOLE BEHIND TINY LITTLE ICONS.
			//   FUNNY, I WONDER IF THE USER-EXPERIENCE SURVEYS I TOOK
			//   THINK THAT I PREFER TO CLICK ON THEIR STUFF INSTEAD 
			//   OF WRITE CODE? WILL WRITING THIS TOOL GIVE ME THE POWER
			//   TO REWRITE THEIR DESIGN FROM GITHUB SOURCES?
		case 'lineWrap':
			if(option.checked) {
				ace.setOption('wrap', 50)
			} else {
				ace.setOption('wrap', false)
			}
			break
		case 'codeFold':
			// SURE, THE CODE EDITOR ON AWS IS FREE TO USE,
			//   AFTER A 12-STEP SIGN-UP PROCCESS, ENTERING 
			//   CREDIT CARD INFORMATION, AND PAYING FOR 
			//   OTHER CLOUD SERVICES TO CONNECT IT TO YOUR
			//   WORKFLOW. GET REAL AMAZON.
			if(option.checked) {
				ace.setOption('foldStyle', 'markbeginend')
			} else {
				ace.setOption('foldStyle', 'manual')
			}
			break
		case 'snapWindows':
			// automatically recovered by frontend-plugin.js
			break
		case 'darkMode':
			break
		default:
	}
}


function doLocals(request) {
	if(typeof request.locals == 'undefined') {
		return
	}
	debugger
	
}


function doConsole(request) {
	if (!ace.session || !ace.session.lineWidgets) {
		return
	}
	let newLines = request.console.replace(/\s*$/, '') // only truncating end line Chrome
																								// see, I do have some nice things to say
	if(!ACE.consoleWidget) {
		ACE.consoleWidget = createLineWidget(newLines + '\n', ACE.lastLine)
		ace.getSession().widgetManager.addLineWidget(ACE.consoleWidget)
	} else {
		ACE.consoleWidget.el.children[0].innerText += newLines + '\n'
	}
	ACE.consoleLines += newLines.split('\n').length
	ACE.consoleWidget.pixelHeight = ace.renderer.lineHeight * ACE.consoleLines
}


function onPaused(request) {
	document.body.classList.remove('starting')
	document.body.classList.add('paused')
	if(!ACE.pausedWidget) {
		ACE.pausedWidget = createLineWidget('PAUSED', ACE.previousNonLibrary, 'morph_pause')
		ace.getSession().widgetManager.addLineWidget(ACE.pausedWidget)
	} else {
		ACE.pausedWidget.row = ACE.previousNonLibrary
		//ace.getSession().widgetManager.addLineWidget(ACE.pausedWidget)
	}
	// debounce
	setTimeout(function () {
		document.body.classList.remove('running')
	}, 1000)
}


function doResult(request) {
	if (!ace.session || !ace.session.lineWidgets) {
		return
	}

	// TODO: display some fancy report?
	document.body.classList.remove('running')
	document.body.classList.add('stopped')

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
		onFrontend(request)
	} else
	if(typeof request.started != 'undefined') {
		onStarted(request)
	} else
	if(typeof request.paused != 'undefined') {
		onPaused(request)
	} else
	

	// the rest of these are console messages
	if(typeof request.warning != 'undefined') {
		debugger
	} else
	if(typeof request.download != 'undefined') {
		emitDownload(request.name, request.download, request.type)
	} else
	if(typeof request.console != 'undefined') {
		doConsole(request)
	} else 
	if(typeof request.error != 'undefined') {
		doError(request)
		doLocals(request)
	} else 
	if(typeof request.result != 'undefined') {
		doResult(request)
	} else 
	if(typeof request.async != 'undefined') {
		// async notifications are like halfway between result and started
		request.started = request.async
		onStarted(request)
	} else 
	if(typeof request.status != 'undefined') {
		doStatus(request)
	} else 
	if(typeof request.locals != 'undefined') {
		doLocals(request)
	} else 
	if(typeof request.cookie != 'undefined') {
		ACE.cookiesList = JSON.parse(request.cookie)
		updateFilelist('Cookies')
	} else 
	if(typeof request.stopped != 'undefined') {
		document.body.classList.remove('paused')
		document.body.classList.remove('running')
		document.body.classList.remove('starting')

	} else {
		console.error('Unrecognized request: ', request)
	}
}


/*
navigator.serviceWorker.register('blob:...', {
	updateUrl: '/sw.js'
})
*/

window.addEventListener('message', onMessage, false)


