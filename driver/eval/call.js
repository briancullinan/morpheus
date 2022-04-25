

let functionCounter = 0



// return an array of evaluated expression to pass into the next function call
async function runParameters(params, runContext) {
	let result = []
	for(let i = 0; i < params.length; i++) {
		let arg = params[i]
		result.push(await runStatement(0, [arg], runContext))
		if(!isStillRunning(runContext)) {
			return // bubble up
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



async function runCallStatements(runContext, functionName, parameterDefinition, before, after, body, ...callArgs) {
	// assign to param names in next context
	let startVars = Object.assign({}, runContext.localVariables)

	let beforeLine = runContext.bubbleLine - 1 // -1 for wrapper function
	runContext.bubbleStack.push(functionName + ' . ' + beforeLine)

	// THIS SHIT IS IMPORTANT. MAKE COMPLICATED SIMPLE.
	// I MENTION THIS TO PEOPLE AND THEY HAVE NO IDEA
	//   WHAT I MEAN. I LEARNED THIS IN MY FANCY 4 YR.
	// https://en.wikipedia.org/wiki/Aspect-oriented_programming
	//   C# DOES THIS AUTOMATICALLY AND PEOPLE LOVE IT
	//   THIS IS BASICALLY HOW IT WORKS INTERNALLY, USES
	//   INTROSPECTION TO READ ATTRIBUTES FROM THE PARSE
	//   THEN CALLS THE FUNCTIONS BEFORE THE ACTUAL CALL
	//   HAPPENS. SYNTACTIC SUGAR.
	if(before) {
		let beforeFunc
		if(runContext.localFunctions[before]) {
			beforeFunc = runContext.localFunctions[before]
		} else if(typeof runContext.localVariables[before] == 'function') {
			beforeFunc = runContext.localVariables[before]
		} else {
			throw new Error('Attribute @Before not found: ' + before)
		}
		// allow users to modify function arguments? SURE!
		let r = await beforeFunc(callArgs, runContext)
	}

	for(let l = 0; l < parameterDefinition.length; l++) {
		if(parameterDefinition[l].type != 'Identifier') {
			throw new Error('FunctionDeclaration: Not implemented!')
		}
		if(l == callArgs.length) {
			continue;
		}
		runContext.localVariables[parameterDefinition[l].name] = callArgs[l]
	}

	// run new command context
	let result = await runStatement(0, [body], runContext)

	// TODO: SOMETHING ABOUT IF AN ASPECT HAS AN EXCPLICIT RETURN 
	//   STATEMENT THEN OVERRIDE THE RETURN VALUE WITH BEFORE
	//   OTHERWISE LEAVE IT UNMODIFIED
	if(after) {
		let afterFunc
		if(runContext.localFunctions[after]) {
			afterFunc = runContext.localFunctions[after]
		} else if(typeof runContext.localVariables[after] == 'function') {
			afterFunc = runContext.localVariables[after]
		} else {
			throw new Error('Attribute @After not found: ' + after)
		}
		result = await afterFunc(result, runContext)
	}

	//Object.assign(runContext.localVariables, startVars) // reset references
	// TODO: LEAKY SCOPE, remove unnamed variables from previous scope
	// TODO: FIX SCOPING WITH A RUNCONTEXT.CONTEXTS STACK
	//   This would help solve var/let, automatically drop var into top context
	//   This would help with static/public/friendly checking
	//   This would help languages with leaky scopes by purpose, LUA, PROLOG?
	//   This would fix scoping around parameter definitions
	// TODO: search the contexts stack for the variable


	runContext.bubbleStack.pop()

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
        if(attribs[k].trim().length == 0
          || !attribs[k].includes('@')) {
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
    if(typeof runContext.localVariables[AST.id.name] != 'undefined') {
      throw new Error('Variable already declared! ' + AST.id.name)
    }
  } else {
    namePrefix += AST.type == 'ArrowFunctionExpression' ? 'lambda ' : 'func '
  }
  let funcName = namePrefix + (AST.id ? AST.id.name : functionCounter)
  ++functionCounter
  let result = (runContext.localFunctions[funcName] 
    = runCallStatements.bind(null, runContext, funcName, AST.params, before, after, AST.body))
  return result
}

async function runCall(AST, runContext) {
  // collect variables
			
  let params = await runParameters(AST.arguments, runContext)
  if(!isStillRunning(runContext)) {
    return // bubble up
  }

  runContext.bubbleMember = null
  let calleeFunc = await runStatement(0, [AST.callee], runContext)
  if(!isStillRunning(runContext)) {
    return // bubble up
  }

  if(calleeFunc) {

  } else
  // TODO: incase libraries aren't sent, preprocessed libs are used here
  if (WEBDRIVER_API[AST.callee.name]) {
    calleeFunc = WEBDRIVER_API[AST.callee.name]
  } else {
    throw new Error('Function not defined: ' + AST.callee.name)
  }
  if(!calleeFunc) {
    debugger
    throw new Error('CallExpression: Not implemented!')
  }

  let beforeLine = runContext.bubbleLine
  try {
    let result;
    currentContext = runContext
    if(AST.type == 'NewExpression') {
      if(calleeFunc == _Promise) {
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
      throw new Error('Not a function! ' + AST.callee.name)
    }
    runContext.bubbleMember = null


    if(!isStillRunning(runContext)) {
      return // bubble up
    }
    if(runContext.libraryLines == 0) {
      throw new Error('Library not loaded!')
    }

    // automatically pause for a second on user functions
    //   to allow users to observe the result of the API
    if(AST.callee.name != 'sleep'
      && beforeLine > runContext.libraryLines) {
      console.log('LONG DELAY!!! ' + beforeLine)
      await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY))
    }
    return result

  } catch (e) {
    doError(e, runContext)
  }

}