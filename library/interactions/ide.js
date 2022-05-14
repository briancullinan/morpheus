

let ACE = {
	consoleLines: 0,
	playCount: 0,
	playButtons: [],
	downloaded: false,
	filename: false,

	// TODO: FEATURE LIKE VISUAL STUDIO WITH THE HIDDEN IMPORTS IN
	//   PROJECT SETTINGS, I THINK ECLIPSE/JAVA DOES THIS TOO.
}

// I DON'T KNOW WHY I THINK THIS STUFF IS COOL, 
// BY PUTTING ACE INTO THE LIBRARY, I WILL BE ABLE TO
// INJECT A NOTEPAD ONTO ANY WEBPAGE, I THINK INTERNET ANNOTATIONS COULD BE FUN
//   LIKE SOME SORT OF PUBLIC BILLBOARD FOR A COMPANY AND THEN ANYONE CAN COME
//   AND COMMENT ON IT, EITHER IN 2D AS A REVIEW TOOL, OR IN 3D AS A SPECTATOR.
function initAce(editorId) {
	// TODO: on native sys_open index.html and use engine as proxy, cebsocket
	ace.edit(editorId)
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


/*
function showConsole(console, lastLine) {
	let newLines = console.replace(/\s*$/, '') // only truncating end like Chrome
																						// see, I do have some nice things to say
	if(!ACE.consoleWidget) {
		ACE.consoleWidget = createLineWidget(newLines + '\n', lastLine)
		ace.getSession().widgetManager.addLineWidget(ACE.consoleWidget)
		ACE.consoleWidget.el.children[0].id = 'console'
		ACE.consoleWidget.editor = initAce('console')
	}
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



function showError(request) {

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

// TODO: INJECT CKEDITOR INSTEAD
*/

