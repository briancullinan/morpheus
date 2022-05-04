
// conversions for accessing pages

const NAMED_FUNCTION = /function\s+([a-z]+[ -~]*)\s*\(/
const EXTENSION_ID = 'lnglmljjcpnpahmfpnfjkgjgmjhegihd';
const EXTENSION_VERSION = '1.0'
const RGBA_REGEX = /rgba?\(([^\)]*)\)/
const FADE_DURATION = 300.0
const FLASH_DURATION = 700.0


// TODO: add information collection _accessors here


// TODO: add utilities from selenium for using Xpath


// TODO: add eye-dropper element selector here

function loadDocumentation() {
	let docs = []
	let libraryFiles = Object.keys(FS.virtual)
	// doesn't work with promises
	// .filter(function (p) { return p.startsWith('library/') })
	for(let i = 0; i < libraryFiles.length; i++) {
		if(libraryFiles[i].startsWith('library/')
			&& libraryFiles[i].endsWith('.md')) {
			docs.push(libraryFiles[i])
		}
	}
	console.log(docs)
	return docs
}

function runBlock(start) {
	if(document.body.className.includes('running')
		|| document.body.className.includes('starting')
		|| document.body.className.includes('paused')) {
		ace.focus()
		return
	}

	document.body.classList.add('starting')

	if(start === -1) {
		sendMessage({
			script: window.ace.getValue()
				.replace(/\s*$/, '') + '\nreturn main();',
			line: ace.session.getLength()
		})
	} else {
		let funcName = NAMED_FUNCTION.exec(
				ace.env.document.getLine(start))[1]
		sendMessage({
			script: ace.session.getLines(start, ACE.lastLine)
				.join('\n').replace(/\s*$/, '') 
				+ '\nreturn ' + funcName + '();\n',
			line: ace.session.getFoldWidgetRange(start).end.row
		})
	}
	ace.focus()
}


function collectForm(dialog) {
	let responseId = dialog.getAttribute('aria-id')
	let formResults = {}
	debugger
	return formResults
}


function doSendForm(reply, dialog, event) {
	let formResults
	let responseId = dialog.getAttribute('aria-id')
	if(event.target && event.target.tagName == 'BUTTON') {
		// SINK!
		return reply({
			responseId: responseId,
			result: formResults
		})
	} else
	if(event.target === dialog
		|| !(formResults = collectForm(dialog))) {
		dialog.style.display = 'none'
		let dialogI = ACE.interactions.indexOf(dialog)
		if(dialogI > -1) {
			ACE.interactions.splice(dialogI, 1)
			updateFilelist('Interactions')
		}
		return reply({
			responseId: responseId
		})
	} else {
	}
}


// TODO: create a drop surface since the game 
//   and editor might interfere



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

// TODO: move all of this to libs so we can affect interaction on other pages
function mergeHTML(request) {
	// INTERESTING, THIS NEIGHBOR WAS TALKING ABOUT CHANGING
	//   NAMES AND PASSING VAIRABLES AROUND AND MAKING MESS,
	//   HE UNDID THE MESS AND THE WHOLE SYSTEM RUNS FASTER.

	// OKAY, THIS IS WHERE THE WHOLE INNERHTML FROM FRONTEND.JS THING
	//   GETS REALLY STUPID. FRONTEND.JS WON'T LET ME INSERT HTML
	//   INTO ANY PAGE FROM AN ARBITRARY STRING. SO I PARSE IT AS XML
	//   SEND IT AS A TREE, AND MERGE IT USING STANDARD DOCUMENT.CREATELEMENT CALLS
	// ABSOLUTELY RIDICULOUS, BUT THIS IS WHAT IT TAKES FOR MY TO CONTROL MY
	//   OWN PERSONAL EXPERIENCE ON THE WEB. THANK YOU DECLARATIVE NET REQUESTS.
	

	return newDialog
}



function showDialog(dialog, request) {
  let newDialog = document.getElementById(request.accessor)
	if(!newDialog) {
		newDialog = document.createElement('DIV')
		document.body.appendChild(newDialog)
	}
	newDialog.setAttribute('aria-id', request.responseId)
	newDialog.onclick = doSendForm.bind(newDialog, reply, newDialog)
  mergeHTML(dialog, newDialog)
  
	// IMPORTANT: prevents inputs from display in game
	INPUT.editorActive = true
	let input = newDialog.getElementsByTagName('input')[0]
	if(!input) {
		input = newDialog.getElementsByTagName('button')[0]
	}
	if(input) {
		input.focus()
	}

	if(typeof ACE.interactions == 'undefined') {
		ACE.interactions = []
	}
	if(!ACE.interactions.includes(newDialog)) {
		ACE.interactions.push(newDialog)
		updateFilelist('Interactions')
	}

}


function hideDialog(dialog) {

  let dialogI = ACE.interactions.indexOf(dialog)
  ACE.interactions.splice(dialogI, 1)
  updateFilelist('Interactions')

}


// I NEED AN EASY WIN, LIKE A WARMUP TASK.
// TODO: inject dark mode into pages that don't support it
//   like uBlock Origin for bad UI/UX.
//   Companies want to keep buying off the shelf crap
//   doesn't mean I have to look at to enjoy the rest of the service.
function toggleOption(option) {
	switch(option.id) {
		case 'syncLocal':
			
			break
		case 'snapWindows':
			sendMessage({ 
				snapWindows: evt.target.checked,
			})
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
			if(option.checked) {
				ace.setTheme('ace/theme/monokai')
				document.body.classList.remove('light')
				document.body.classList.add('dark')
				// is this the first tooling connection to the engine?
				//   I guess file-list updates
				if(typeof Cvar_Set != 'undefined') {
					Cvar_Set(stringToAddress('cl_conColor'), stringToAddress('0 0 0 255'))
					Cvar_Set(stringToAddress('cl_textColor'), stringToAddress('255 255 255 255'))
				}
			} else {
				ace.setTheme('ace/theme/xcode')
				document.body.classList.add('light')
				document.body.classList.remove('dark')
				if(typeof Cvar_Set != 'undefined') {
					Cvar_Set(stringToAddress('cl_conColor'), stringToAddress('255 255 255 255'))
					Cvar_Set(stringToAddress('cl_textColor'), stringToAddress('0 0 0 255'))
				}
			}
			break
		default:
	}
}

// THIS IS ABOUT ALL THE BOILERPLATE I CAN TOLERATE TO BOOT A WASM FILE
//   EMSCRIPTEN IS WHAT 10,000 LINES OF BOILERPLATE?

function initEngine() {
	initWasm({
		SYS: SYS,
		GL: GL,
		EMGL: EMGL,
		INPUT: INPUT,
	})
	let startArgs = getQueryCommands()
	initProgram(startArgs)
}



// BECAUSE IT'S FUCKING PRETTIER, OKAY?
function updateGlobalFunctions(GLOBAL) {

	// assign everything to env because this __attribute(import) BS don't work
	let startKeys = Object.keys(GLOBAL)
	let startValues = Object.values(GLOBAL)
	if(typeof window != 'undefined') {
		for(let i = 0; i < startKeys.length; i++) {
			ENV[startKeys[i]] =
			window[startKeys[i]] = startValues[i] //.apply(ENV.exports)
		}
		Object.assign(ENV, GLOBAL)
	} else if (typeof global != 'undefined') {
		for(let i = 0; i < startKeys.length; i++) {
			ENV[startKeys[i]] =
			global[startKeys[i]] = startValues[i] //.apply(ENV.exports)
		}
		Object.assign(ENV, GLOBAL)
	}

}

// write it non-async just in case wasm is support but not es6?
function initWasm(bytes, env) {
	if(isStreaming) {
		return WebAssembly.instantiateStreaming(bytes, env)
	} else {
		return WebAssembly.instantiate(bytes, env)
	}
}

function initDedicated() {
	Sys_fork()
		let startArgs = [
		'+set', 'dedicated', '1'
	].concat(getQueryCommands())
	Sys_exec(stringToAddress('quake3e.ded.wasm'), stringsToMemory(startArgs))
}


