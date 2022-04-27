

let currentContext


const DEFAULT_DELAY = 1000
const DEFAULT_SHORT_DELAY = 100



// INTERESTING FOR CODE REVEIWS, HABIT OF EXTRACTING DOUBLE NEGATIVES?
function isStillRunning(runContext) {
	if(!runContext.paused && !runContext.ended 
		&& !runContext.broken && !runContext.returned) {
		return true
	}
	return false
}

async function runStatement(i, AST, runContext) {
	if(!isStillRunning(runContext)) {
		throw new Error('context ended!')
	}
	try {
		if(AST[i] && AST[i].loc) {
			runContext.bubbleColumn = AST[i].loc.start.column
			if(runContext.bubbleLine != AST[i].loc.start.line) {
				runContext.bubbleLine = AST[i].loc.start.line
				runContext.bubbleAST = AST
				// normally we'd skip and let it run async
				//   but doStatus() also does @Delay()
				await doStatus(runContext, (!AST[i].callee || AST[i].callee.name != 'sleep'))
			}
		}

		// HOW THE HELL DO I TEST IF A LANGUAGE IMPLEMENTATION 
		//    IS FEATURE COMPLETE?
		//////////////////////////  PASS-THRU
		if(AST[i].type == 'Literal' || AST[i].type == 'Identifier') {
			return runPrimitive(AST[i], runContext)
		} else 
		if(AST[i].type == 'BreakStatement') {
			runContext.broken = true // TODO: check how detailed parser is, 
			//   break and continue are statements in for-loop? or general statements?
			return
		} else
		if(AST[i].type == 'BlockStatement') {
			return await runBody(AST[i].body, runContext)
		} else
		// TODO: WHAT IS THIS? func(varName = default?)
		if(AST[i].type == 'AssignmentExpression') {
			return await runAssignment(AST[i].left, AST[i].right, runContext)
		} else
		if(AST[i].type == 'BinaryExpression'
			|| AST[i].type == 'LogicalExpression') {
			return await runBinary(AST[i], runContext)
		} else
		// WTF I KEEP MISSING RETURN AWAIT?!!! NEED TO WRITE AN AST IN PROLOG
		//   THEN WRITE PROLOG PARSER IN JAVASCRIPT TO EVALUATE MATCHING AST
		//   TREE FROM ACORN/BISON/ANTLR
		if(AST[i].type == 'ForStatement') {
			return await runLoop(
				AST[i].init, 
				AST[i].test, 
				AST[i].update, 
				AST[i].body, 
				runContext)
		} else
		if(AST[i].type == 'UpdateExpression') {
			return runUpdate(AST[i], runContext)
		} else 




		///////////////////////////////// RECURSIVE
		if(AST[i].type == 'ExpressionStatement') {
			return await runStatement(0, [AST[i].expression], runContext)
		} else
		// we are already awaiting for everything
		if(AST[i].type == 'AwaitExpression') {
			return await runStatement(0, [AST[i].argument], runContext)
		} else
		if(AST[i].type == 'ReturnStatement') {
			runContext.returned = true
			if(AST[i].argument && AST[i].argument.type) {
				runContext.bubbleReturn = await runStatement(0, [AST[i].argument], runContext)
				return runContext.bubbleReturn
			} else {
				return
			}
		} else
		if(AST[i].type == 'VariableDeclaration') {
			let result
			// so context doesn't disappear
			for(let j = 0; j < AST[i].declarations.length; j++) {
				result = await runStatement(j, AST[i].declarations, runContext)
				if(!isStillRunning(runContext)) { // bubble up
					return
				}
			}
			return result
		} else
		if(AST[i].type == 'VariableDeclarator') {
			return await runVariable(AST[i], runContext)
		} else 


		if(AST[i].type == 'CallExpression' || AST[i].type == 'NewExpression') {
			return await runCall(AST[i], runContext)
		} else
		if(AST[i].type == 'FunctionExpression' 
			|| AST[i].type == 'ArrowFunctionExpression'
			|| AST[i].type == 'FunctionDeclaration') {
			return await runFunction(AST[i], runContext)

		} else
		if(AST[i].type == 'MemberExpression') {
			return await runMember(AST[i], runContext)
		} else
		if(AST[i].type == 'ObjectExpression') {
			return await runObject(AST[i], runContext)
		} else
		if(AST[i].type == 'UnaryExpression') {
			return await runUnary(AST[i], runContext)
		} else 
		if(AST[i].type == 'IfStatement') {
			let result = await runStatement(0, [AST[i].test], runContext)
			if(!isStillRunning(runContext)) {
				return
			}
			if(result) {
				return await runStatement(0, [AST[i].consequent], runContext)
			} else if (AST[i].alternate) {
				return await runStatement(0, [AST[i].alternate], runContext) 
			}
		} else
		if(AST[i].type == 'DebuggerStatement') {
			// WTF IS THIS SHIT?
			//  https://www.ics.uci.edu/~pattis/common/handouts/macmingweclipse/allexperimental/mac-gdb-install.html
			// I HAVE TO SIGN MY OWN COPY OF DBG TO USE IT ON 
			//   NATIVE APPLICATIONS?
			// WHY THE FUCK DOESN'T APPLE HAVE A CLICK 12 TIMES
			//   TO ENABLE DEVELOPER MODE ON MACOS SO YOU CAN DEBUG
			//   AND INSTALL YOUR OWN MODULES WITHOUT DISABLING
			//   SOME SYSTEM LEVEL SECURITY?
			// I'LL TELL YOU WHY, BECAUSE APPLE HATES DEVELOPERS
			//   THE DON'T OWN.
			// I WONDER IF THIS EVALUATOR IS FAST ENOUGH TO RENDER
			//   SKYBOXES ON A CLOUD GPU FROM OTHER WORLDS/GAMES?
			runContext.paused = true
			chrome.tabs.sendMessage(runContext.senderId, { 
				paused: '.', 
				line: runContext.bubbleLine - 1
			}, function () { console.log('debugging' )})
			return
		} else
		if(AST[i].type == 'DoWhileStatement') {
			await runWhile(AST[i], runContext)
		} else


		{
			debugger
			throw new Error(AST[i].type + ': Not implemented!')
		}

	} catch (e) {
		doError(e, runContext)
		return
	}
}

// find and run main
async function runBody(AST, runContext) {
	if(!isStillRunning(runContext)) {
		throw new Error('context ended!')
	}

	// TODO: FIX CONTEXTS. THIS IS ONE OF THE THINGS THAT
	//   SERIOUSLY BOTHERS ME ABOUT CHROME DEBUGGER, IF I 
	//   AM IN A DIFFERENT SCOPE LOOKING AT A VARIABLE WITH
	//   THE SAME NAME AS THE SCOPE IT'S PAUSED ON, IT SHOWS
	//   ME THE WRONG SCOPE WHEN I USE THE STACK!

	// restore outer scope when context was created
	//Object.assign(callStack, runContext.localFunctions)
	//Object.assign(callStack, outerContext.localVariables)
	// replace with current context
	//Object.assign(callStack, runContext.localVariables)


	// any time a setTimer is use the callStack will be reset
	//   which means error messaging must intercept here not to
	//   ruin out worker process
	try {
			// doesn't need to be fast, because async DevTools calls, are not fast
		let startFuncs = Object.assign({}, runContext.localFunctions)
		//runContext.localFunctions = 
		let startVars = Object.assign({}, runContext.localVariables)

		let result = await runParameters(AST, runContext)
		if(!isStillRunning(runContext)) {
			return
		}
		// remove anything created in the past context
		//Object.assign(runContext.localFunctions, startFuncs)
		//Object.assign(runContext.localVariables, startVars)
		// TODO: LEAKY SCOPE, this way we keep the same object the whole time
		//runContext.localFunctions = start
		//runContext.localVariables = startVars
		return result.pop()
	} catch (e) {
		doError(e, runContext)
	}
}


async function doPlay(runContext) {
	try {
		let env = await createEnvironment(runContext)
		await createRunContext(runContext, env)
		threads[runContext.runId] = runContext
		// attach debugger
		await attachDebugger(runContext.senderId)
		// run code from client
		let result = await runBody(runContext.body[0].expression.callee.body.body, runContext)
		if(!isStillRunning(runContext)) {
			// TODO: send async status?
		} else if (runContext.async) {
			chrome.tabs.sendMessage(runContext.senderId, { 
				async: runContext.runId 
			}, function(response) {

			});
		} else {
			chrome.tabs.sendMessage(runContext.senderId, { result: result + '' }, function(response) {

			});
		}
					
	} catch (e) {
		doError(e, runContext)
	}

}



