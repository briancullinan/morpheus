

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



function doAssert() {

}
// let POSSIBLE_IGNORE = ['loc', 'start', 'end']
// let POSSIBLE_LEAVES = ['computed', 'optional', 'type', 'id', 'name']

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
		if(AST[i].type == 'AssignmentExpression') {
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
			continue
		} else if (AST[i].type == 'VariableDeclarator') {
			let varName
			let valueString
			if(AST[i].id.type == 'Identifier') {
				varName = AST[i].id.name
				valueString = doProperty(runContext.localVariables[varName])
			}
			assignments[AST[i].loc.start.line] = new Array(bubbleColumn)
				.fill(' ').join('') + varName + ' = ' + valueString + '\n'
			continue
		}

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
	return assignments
}




// check on runner
function doStatusResponse(request, reply) {
	let runContext = threads[request.runId]
	if(typeof runContext == 'undefined' || runContext.ended) {
		reply({ 
			stopped: _encodeRuns(), 
			line: runContext.bubbleLine - 1
		})
		return
	}

	if(typeof request.pause != 'undefined') {
		runContext.paused = request.pause
		if(request.pause) {
			reply({ 
				paused: _encodeRuns(), 
				line: runContext.bubbleLine - 1,
				stack: runContext.bubbleStack,
			})
			return 
		} else {
			// continues automatically from shouldBubbleOut() calls
			// TODO: set timeout and test another statement executed
			//   reply( stopped: or playing: )
		}
	}

	// now every status check will report on current line number also
	reply({ 
		status: _encodeRuns(), 
		line: runContext.bubbleLine - 1,
		stack: runContext.bubbleStack,
	})
}


