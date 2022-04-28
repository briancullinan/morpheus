

let threads = {

}


// log an object.property to the console
function doProperty(value, noRecurse) {
	// TODO: detect runCallStatements symbols on function.AST and call code generation worker


	// LOL! GODDAMNIT GOOGLE, IT'S 2022, YOU CAN'T SHOW US YOUR OWN SOURCE CODE
	//   I MEAN WHEN YOU CLICK ON IT IN THE DEBUGGER OF COURSE, SINCE THIS IS A REPL
	// VISUAL STUDIO DOES THIS! YOU CAN EVEN FIND VISUAL STUDIO SOURCE CODE THROUGH
	//   THE SYMBOL SELECTOR
	if(typeof value == 'function' || typeof value == 'async function') {
		return (value + '').replace(/\{[\n\r\s\S]*\}/, ' [ native code ] ')
											 .replace(/=>[\n\r\s\S]*/, ' [ native code ] ')
	} else if (typeof value == 'object' && value !== null) {
		let prototypeName = (Object.getPrototypeOf(value).constructor + '')
				.replace(/function?\s*|\(.*$/gi, '')
				|| (Object.getPrototypeOf(value) + '')
				.replace(/^\[object |]$/gi, '')
		if(!noRecurse) {
			// HEY GOOGLE CHROME DEBUGGER, LOOK AT THIS! 1 EXTRA LEVEL OF OBJECT VALUES SO I DON'T
			//   HAVE TO SIT AROUND WAITING FOR THE STUPID IMMEDIATE BUBBLE TO POP UP
			let properties = Object.getOwnPropertyNames(value)
				.reduce((str, prop) => {
					return (str + (str.length ? ', ' : '') + prop + ': ' 
						+ doProperty(value[prop], true) + ' ')
				}, '')
			//let methods = Object.getPrototypeOf(valueString).methods
			return '[' + prototypeName + '] {' + properties + '}'
		} else {
			return '[object ' + prototypeName + ']'
		}
	} else {
		return value + ''
	}
}




function doConsole(tabId, ...args) {
	console.log(args)
	let consoleStrings = args.map(a => doProperty(a)).join ('\n')
	chrome.tabs.sendMessage(tabId, { console: consoleStrings }, function(response) {

	});
}



function doAssign(varName, lineNumber, bubbleColumn, runContext) {
	try {
		let valueString
		if(varName.includes('.')) {
			valueString = doProperty(runContext.localVariables[varName.split('.')[0]][varName.split('.')[1]])
		} else {
			valueString = doProperty(runContext.localVariables[varName])
		}
		chrome.tabs.sendMessage(runContext.senderId, { 
			assign: new Array(bubbleColumn).fill(' ').join('') + varName + ' = ' + valueString + '\n',
			// always subtract 1 because code is wrapping in a 1-line function above
			line: lineNumber,
		}, function(response) {
	
		});
	} catch (e) {
		if(e.message.includes('context invalidated')) {

		} else {
			debugger
		}
	}
}


async function doStatus(runContext, doSleep) {
	try {
		chrome.tabs.sendMessage(runContext.senderId, { 
			status: '.',
			// always subtract 1 because code is wrapping in a 1-line function above
			line: runContext.bubbleLine - 1,
			stack: runContext.bubbleStack,
			file: runContext.bubbleFile,
		}, function(response) {
	
		});
		console.log(runContext.bubbleLine)
		// don't sleep on library functions
		if(doSleep && runContext.bubbleFile == '<eval>') {
			console.log('DELAYING! ' + runContext.bubbleLine)
			await new Promise(resolve => setTimeout(resolve, DEFAULT_SHORT_DELAY))
		}
	} catch (e) {
		if(e.message.includes('context invalidated')) {

		} else {
			debugger
		}
	}
}


function doAssert() {

}
// let POSSIBLE_IGNORE = ['loc', 'start', 'end']
// let POSSIBLE_LEAVES = ['computed', 'optional', 'type']

let POSSIBLE_BRANCHES = [
	'left', 'right', 'body', 'params', 'argument',
	'expression', 'init', 'test', 'update', 'object',
	'declarations', 'callee'
]

function doAssignments(AST, runContext) {
	let assignments = {}
	for(let i = 0; i < AST.length; i++) {
		if(!AST[i].loc) {
			continue
		}
		let bubbleColumn = AST[i].loc.start.column
		if(AST[i] == 'AssignmentExpression') {
			let varName
			let valueString
			if(AST[i].left.type == 'Identifier') {
				varName = AST[i].left.name
				valueString = doProperty(runContext.localVariables[varName])
			} else if(AST[i].left.type == 'MemberExpression') {
				varName = AST[i].left.object.name
				let property = AST[i].left.property.name
				valueString = doProperty(runContext.localVariables[varName][property])
				varName += '.' + property
			}
			assignments[AST[i].loc.start.line] = new Array(bubbleColumn)
				.fill(' ').join('') + varName + ' = ' + valueString + '\n'
		} else {
			for(let j = 0; j < POSSIBLE_BRANCHES.length; ++j) {
				if(typeof AST[i][POSSIBLE_BRANCHES[j]] != 'undefined') {
					if(typeof AST[i][POSSIBLE_BRANCHES[j]].type) {
						let childAssigns = doAssignments([AST[i][POSSIBLE_BRANCHES[j]]], runContext)
						Object.assign(assignments, childAssigns)
					} else if (typeof AST[i][POSSIBLE_BRANCHES[j]].length != 0
						&& typeof AST[i][POSSIBLE_BRANCHES[j]][0].type != 'undefined') {
						let childAssigns = doAssignments(AST[i][POSSIBLE_BRANCHES[j]], runContext)
						Object.assign(assignments, childAssigns)
					} else {
						// don't know what to do
					}
				}
			}
		}
	}
	return assignments
}


function doError(err, runContext) {
	try {
		runContext.ended = true
		console.log('line: ' + (runContext.bubbleLine - 1), err)
		chrome.tabs.sendMessage(runContext.senderId, { 
			error: err.message + '',
			// always subtract 1 because code is wrapping in a 1-line function above
			line: runContext.bubbleLine - 1,
			file: runContext.bubbleFile,
			stack: runContext.bubbleStack,
			// LOOK AT THIS FANCY SHIT GOOGLE CHROME DEBUGGER!
			//   MAKE A LIST OF ASSIGNMENTS NEARBY AND SEND THEIR CURRENT VALUE TO THE FRONTEND
			//   TO SAVE THE DEVELOPER TIME RERUNNING THEIR WHOLE PROGRAM JUST TO SET UP A BREAK
			//   POINT, JUST TO CHECK THE VALUE OF A LOOSELY TYPED VARIABLE. SEE THAT? LOOSE
			//   TYPING WORKS JUST FINE IF YOUR TOOLS SUPPORT YOU INSTEAD OF WORKING AGAINST YOU
			// SEE, IT'S A CATCH22, WHY WOULD I SPIN MY WHEELS FIXING CHROME DEBUGGER'S SOURCE CODE
			//   WHEN THE EXPECTATION IS THAT IF I DON'T LIKE IT, I CAN FIX IT MYSELF. THAT'S WHY
			//   IT SUCKS STILL. THE WHOLE "OPEN SOURCE DOESN'T OWE YOU ANYTHING", IS A SELF 
			//   DEFEATING PRINCINPAL, LIKE IF ALL THE AMERICAN FARMERS DECIDED TO LET PEOPLE STARVE
			//                                         (HUNGRY? FIX THE TRACTOR YOURSELF)
			//   THEY DON'T OWE YOU ANYTHING, NOT EVEN LIFE SUPPORT. FUCK OFF FOSS, FOSS OWES ME
			//   EVERYTHING BECAUSE I'LL BE THE ONE STUCK CLEANING THIS SHIT CODE UP.
			//   TECHNICAL DEBT APPLIES TO PUBLISHING INCORRECT CODE DO. CODE IS LIKE LITTER.
			locals: runContext.bubbleAST ? doAssignments(runContext.bubbleAST) : [],
		}, function(response) {
	
		});
	} catch (e) {
		if(e.message.includes('context invalidated')) {
		} else {
			debugger
		}
	}
}



// check on runner
function doStatusResponse(request, reply) {
	let runContext = threads[request.runId]
	if(typeof runContext == 'undefined') {
		reply({ 
			stopped: '.', 
			line: 0
		})
		return
	}
	
	if(runContext.ended) {
		reply({ 
			stopped: '.', 
			line: runContext.bubbleLine - 1
		})
		return
	} else

	if(typeof request.pause != 'undefined') {
		runContext.paused = request.pause
		if(request.pause) {
			reply({ 
				paused: '.', 
				line: runContext.bubbleLine - 1,
				stack: runContext.bubbleStack,
			})
		} else {
				// TODO: continue
				debugger
		}
		return 
	}

	// now every status check will report on current line number also
	reply({ 
		status: '.', 
		line: runContext.bubbleLine - 1,
		stack: runContext.bubbleStack,
	})
}


