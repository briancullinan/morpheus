

let functionCounter = 0

const MAX_CALL = 10000

const FUNC_COMMENTS = /(^|\s*[^\/\s]+.*\n)(\s*\/\/.*\n)+(async|function|\s).*?$/
const ASPECTS_REGEX = /\s+|\n+|\(|\)|function|async/g


// return an array of evaluated expression to pass into the next function call
async function runParameters(params, runContext) {
	let result = []
	for(let i = 0; i < params.length; i++) {
		let arg = params[i]
		result.push(await runStatement(0, [arg], runContext))
		if(await shouldBubbleOut(runContext)) {
			return result // bubble up
		}
	}
	return result
}

// API calls are now embedded in web page and uploaded to backend.js
//   see driver/library.js
let WEBDRIVER_API = {
	exports: {}
}


// TODO: add 
// @Late
// Syntax to use late binding, store the AST assignment in localVariables
//   And when the variable is accesssed, check for the AST and runStatement()



async function runCallStatements(runContext, functionName, filename, parameterDefinition, before, after, body, ...callArgs) {
	// assign to param names in next context
	let startVars = Object.assign({}, runContext.localVariables)

	let beforeLine = runContext.bubbleLine - 1 // -1 for wrapper function
	if(runContext.bubbleStack.length == 0) {
		console.error('Call stack corrupted')
	}
	runContext.bubbleStack.push([functionName, filename, beforeLine])
	let result
	try {
		
		// THIS SHIT IS IMPORTANT. MAKE COMPLICATED SIMPLE.
		// I MENTION THIS TO PEOPLE AND THEY HAVE NO IDEA
		//   WHAT I MEAN. I LEARNED THIS IN MY FANCY 4 YR.
		// https://en.wikipedia.org/wiki/Aspect-oriented_programming
		//   C# DOES THIS AUTOMATICALLY AND PEOPLE LOVE IT
		//   THIS IS BASICALLY HOW IT WORKS INTERNALLY, USES
		//   INTROSPECTION TO READ ATTRIBUTES FROM THE PARSE
		//   THEN CALLS THE FUNCTIONS BEFORE THE ACTUAL CALL
		//   HAPPENS. SYNTACTIC SUGAR. EVERY LANGUAGE SHOULD HAVE ATTRIBUTES
		if(before) {
			let beforeFunc
			if(runContext.localVariables[before] == 'function') {
				beforeFunc = runContext.localVariables[before]
			} else {
				throw new Error('Attribute @Before not found: ' + before)
			}
			// allow users to modify function arguments? SURE!
			let r = await beforeFunc(callArgs, runContext)
		}
		if(await shouldBubbleOut(runContext)) {
			return
		}

		for(let l = 0; l < parameterDefinition.length; l++) {
			if(parameterDefinition[l].type != 'Identifier') {
				throw new Error('FunctionDeclaration: Not implemented!')
			}
			if(l == callArgs.length) {
				continue;
			}
			// fuck-arounds?
			if(typeof runContext.localVariables == 'undefined') {
				debugger
			}
			runContext.localVariables[parameterDefinition[l].name] = 'undefined'
			await runAssignment({
				type: 'Identifier',
				name: parameterDefinition[l].name
			}, {
				type: 'Literal',
				value: callArgs[l]
			}, runContext)
			if(await shouldBubbleOut(runContext)) {
				return
			}
		}

		// run new command context
		result = await runStatement(0, [body], runContext)

		// TODO: SOMETHING ABOUT IF AN ASPECT HAS AN EXCPLICIT RETURN 
		//   STATEMENT THEN OVERRIDE THE RETURN VALUE WITH BEFORE
		//   OTHERWISE LEAVE IT UNMODIFIED
		if(after) {
			let afterFunc
			if(runContext.localVariables[after] == 'function') {
				afterFunc = runContext.localVariables[after]
			} else {
				throw new Error('Attribute @After not found: ' + after)
			}
			result = await afterFunc(result, runContext)
		}
		runContext.bubbleMember = null
		runContext.bubbleProperty = ''
		if(runContext.returned) {
			runContext.returned = false
			if(result !== runContext.bubbleReturn) {
				console.log('WARNING: not bubbling correctly: ' + functionName)
			}
			result = runContext.bubbleReturn
			delete runContext.bubbleReturn
		}
		if(await shouldBubbleOut(runContext)) {
			return
		}

	//Object.assign(runContext.localVariables, startVars) // reset references
	// TODO: LEAKY SCOPE, remove unnamed variables from previous scope
	// TODO: FIX SCOPING WITH A RUNCONTEXT.CONTEXTS STACK
	//   This would help solve var/let, automatically drop var into top context
	//   This would help with static/public/friendly checking
	//   This would help languages with leaky scopes by purpose, LUA, PROLOG?
	//   This would fix scoping around parameter definitions
	// TODO: search the contexts stack for the variable
	} catch (e) {
		throw e
	} finally {
		runContext.bubbleStack.pop()
		if(runContext.bubbleStack.length == 0) {
			console.error('Call stack corrupted')
		}
	}

	return result
}



async function runFunction(AST, runContext) {
	let before
	let after
	let namePrefix = ''
	if(AST.type == 'FunctionExpression' 
	|| AST.type == 'ArrowFunctionExpression') {
		namePrefix = 'inline '
	} else {
		// ATTRIBUTE SUPPORT
		// TODO: C# GIVES YOU A WAY TO ADD ATTRIBUTES TO
		//   MANY TOKEN TYPES 
		//   JAVA HAS ATTRIBUTES TOO, BUT THEY ARE UGLIER
		// TODO: @Delay(), @LongLoops() and other safetys
		// TODO: STATIC CONSTRUCTORS, STD LIBRARY LOADERS
		// TODO: onBefore, onAfter, control flow imprinting
		let attributeComments = runContext.script
			.substring(0, AST.start)
			.match(FUNC_COMMENTS)
		if(attributeComments) {
			let attribs = attributeComments[0].split(ASPECTS_REGEX)
			for(let k = 0; k < attribs.length; k++) {
				if(attribs[k].trim().length == 0 || !attribs[k].includes('@')) {
					continue
				} else
				if(attribs[k] == '@Before') {
					before = attribs[k+1]
					++k
				} else
				if(attribs[k] == '@After') {
					after = attribs[k+1]
					++k
				} else {
					doConsole(runContext.senderId, 
						'WARNING: Attribute not recognized: ' + attribs[k])
				}

			}
		}
	}
	if(AST.id) {
		// don't add namePrefix!
		if(runContext.localVariables.hasOwnProperty(AST.id.name)) {
			throw new Error('Variable already declared! ' + AST.id.name)
		}
	} else {
		namePrefix += AST.type == 'ArrowFunctionExpression' ? 'lambda ' : 'func '
	}

	let funcName = namePrefix + (AST.id ? AST.id.name : functionCounter)
	++functionCounter
	runContext.localVariables[funcName] = 'undefined'
	let newFunc = runCallStatements.bind(null, runContext,
			funcName, runContext.bubbleFile, AST.params, before, after, AST.body)
	newFunc.filename = runContext.bubbleFile
	let result = await runAssignment({
		type: 'Identifier',
		name: funcName,
	}, {
		type: 'Literal',
		value: newFunc,
	}, runContext)

	return result
}



async function runCall(AST, runContext) {
	// collect variables
			
	let params = await runParameters(AST.arguments, runContext)
	if(await shouldBubbleOut(runContext)) {
		return // bubble up
	}

	runContext.bubbleMember = null
	runContext.bubbleProperty = ''
	let calleeFunc
	let functionName
	if(AST.callee.type == 'Identifier') {
		// handle identifiers here because looking it up with bubble up an error
		functionName = AST.callee.name
		try {
			// TODO: should probably have a better way of handling NOT-ERROR
			calleeFunc = await runPrimitive(AST.callee, runContext)
		} catch (up) {
			if(!up.message.includes('not defined')
					// CODE REVIEW, meant to do this earlier
					&& !up.message.includes('access error')) {
				throw up
			}
		}
		if(await shouldBubbleOut(runContext)) {
			return // bubble up
		}

		// CODE REVIEW: omg it's ready
		let lib
		// TODO: shortcut the frontend FS.virtual
		//   for now and just provide whatever is saved in IDBFS
		// will need RPC to save code storage, will provide it in
		//   cloud build so needs to be generic through accessors.
		if (!calleeFunc
			&& runContext.bubbleFile != 'library/repl.js'
			&& (lib = findDefinition(functionName))
		) {
			calleeFunc = await onAccessor(lib)
		}
	} else
	if(AST.callee.type) {
		calleeFunc = await runStatement(0, [AST.callee], runContext)
		if(await shouldBubbleOut(runContext)) {
			return // bubble up
		}
		functionName = runContext.bubbleProperty

	} else {
		throw new Error('CallExpression: Not implemented!')
	}

	if(!calleeFunc) {
		debugger
		throw new Error('Function not defined: ' + AST.callee.name)
	}


	let beforeLine = runContext.bubbleLine - 1
	if(calleeFunc.interpreted) {
		// interpreted runCallStatements will add to stack at next layer
	} else {
		if(runContext.bubbleStack.length == 0) {
			console.error('Call stack corrupted')
		}	
		runContext.bubbleStack.push([
			functionName, 
			calleeFunc.filename || '[ native code ]', 
			beforeLine
		])
	}
	if(runContext.bubbleStack.length > MAX_CALL) {
		throw new Error('Call stack exceeded!')
	}

	runContext.localVariables['arguments'] = 'undefined'
	await runAssignment({
		type: 'Identifier',
		name: 'arguments'
	}, {
		type: 'Literal',
		value: params
	}, runContext)
	// TODO: __func__, __line__, __file__ for debugging fun


	try {
		let result;
		if(AST.type == 'NewExpression') {
			if(calleeFunc == Promise) {
				result = Promise.resolve().then(d => {
					runContext.asyncRunners++
					return d
				}).then(internalResolve).catch(e => {
					runContext.asyncRunners--
					throw e
				}).then(d => {
					runContext.asyncRunners--
					return d
				})
			} else {
				result = await (new calleeFunc(...params))
			}
		} else if (typeof calleeFunc == 'function'
			&& runContext.bubbleMember) {
			result = await calleeFunc.apply(runContext.bubbleMember, params)
		} else if (typeof calleeFunc == 'function') {
			result = await calleeFunc(...params)
		} else {
			debugger
			throw new Error('Not a function! ' + AST.callee.name)
		}
		runContext.bubbleMember = null
		runContext.bubbleProperty = ''
		if(runContext.returned) {
			runContext.returned = false
			if(result !== runContext.bubbleReturn) {
				console.log('WARNING: not bubbling correctly: ' + functionName)
			}
			result = runContext.bubbleReturn
			delete runContext.bubbleReturn
		}

		// must come after runContext.returned is adjusted 
		//   because this bubbles out of whatever block or 
		//   for-loop is in scope.
		if(await shouldBubbleOut(runContext)) {
			return // bubble up
		}

		// automatically pause for a second on user functions
		//   to allow users to observe the result of the API
		if(AST.callee.name != 'sleep'
			&& runContext.bubbleStack[
				runContext.bubbleStack.length] == '<eval>') {
			console.log('LONG DELAY!!! ' + functionName + ' . ' + beforeLine)
			debugger
			await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY))
		}
		return result

	} catch (e) {
		console.log(e)
		await doError(e, runContext)
		runContext.ended = true
		return
	} finally {
		if(!calleeFunc.interpreted) {
			runContext.bubbleStack.pop()
			if(runContext.bubbleStack.length == 0) {
				console.error('Call stack corrupted')
			}
		}
	}

}
