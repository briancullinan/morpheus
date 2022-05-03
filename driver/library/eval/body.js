

let currentContext


const DEFAULT_DELAY = 1000
const DEFAULT_SHORT_DELAY = 100
const DEFAULT_PAUSED_INTERVAL = 100



// INTERESTING FOR CODE REVEIWS, HABIT OF EXTRACTING DOUBLE NEGATIVES?
async function shouldBubbleOut(runContext) {
	if(runContext.paused
		&& (runContext.bubbleFile == '<eval>'
		// TODO: @Rollback() for failed dialogs to step back 1 statement 
		//   so we can play the thread and pick up again
			|| runContext.bubbleAST.type == 'DebuggerStatement')
		) {
		// add a paused handler for debug and continue
		//   this will handle restorations for live programs
		//   it will just sit here and wait for the play button.
		// BUT IS THIS REALLY GOOD ENOUGH? SURE WE CAN ATTACH TO A LIVE
		//   PROGRAM WITH A DEBUGGER, BUT SHOULDN'T WE BE ABLE TO TELL
		//   THE PROGRAM WHAT STATE OF MIND IT'S IN?
		// TODO: ENCODE RUNSTATEMENT() CALL STACK AND HASH CONTEXTS
		//   SAVE AND RESTORE CONTEXTS FROM JSON ENTIRELY, SO IN 
		//   THE FUTURE WE CAN PROGRAM OUR PROGRAMS, LIKE FIXING THE FLASHING CLOCK ON A VCR.
		await new Promise(function (resolve) {
			let pausedTimer
			pausedTimer = setInterval(function () {
				if(!runContext.paused) {
					clearInterval(pausedTimer)
					resolve()
				}
			}, DEFAULT_PAUSED_INTERVAL)
		})
	}
	// THESE ARE TOGGLED AT DIFFERENT TIMES TO CONTROL EVALUATOR FLOW.
	if(runContext.ended || runContext.broken || runContext.returned) {
		return true
	}
	return false
}

async function runStatement(i, AST, runContext) {
	try {
    currentContext = runContext
		if(AST[i] && AST[i].loc) {
			runContext.bubbleColumn = AST[i].loc.start.column
			if(runContext.bubbleLine != AST[i].loc.start.line) {
				runContext.bubbleTime = Date.now()
				runContext.bubbleLine = AST[i].loc.start.line
				runContext.bubbleAST = AST
				// normally we'd skip and let it run async
				//   but doStatus() also does @Delay()
				if(typeof doStatus != 'undefined') { // BOOTSTRAP CODE?
					let doSleep = runContext.bubbleFile == '<eval>'
					&& (!AST[i].callee || AST[i].callee.name != 'sleep')
					await doStatus(doSleep)
				}
			}
		}

		// moved this here so we get the line number of the latest statement
		//   ONLY PAUSE ON <EVAL> CALLS
		if(await shouldBubbleOut(runContext)) {
			throw new Error('context ended!')
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
			// WOW! IMAGINE THAT! SHOW VARIABLES BEFORE AND AFTER ASSIGNMENT! GOOGLE CHROME DEBUGGER!
			// doAssign
			return await runAssignment(AST[i].left, AST[i].right, runContext)
		} else
		if(AST[i].type == 'BinaryExpression') {
			return await runBinary(AST[i], runContext)
		} else
		if(AST[i].type == 'LogicalExpression') {
			return await runLogical(AST[i], runContext)
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
			// doAssign
			return await runUpdate(AST[i], runContext)
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
			if(AST[i].argument && AST[i].argument.type) {
				runContext.bubbleReturn = await runStatement(0, [AST[i].argument], runContext)
				runContext.returned = true
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
				if(await shouldBubbleOut(runContext)) { // bubble up
					return
				}
			}
			return result
		} else
		if(AST[i].type == 'VariableDeclarator') {
			// doAssign
			return await runAssignment(AST[i].id, AST[i].init, runContext)
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
			if(await shouldBubbleOut(runContext)) {
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
			runContext.bubbleAST = AST[i]
			runContext.paused = true
			sendMessage({ 
				paused: '.', 
				line: runContext.bubbleLine - 1
			})
			return
		} else

		if(AST[i].type == 'DoWhileStatement') {
			await runWhile(AST[i], runContext)
		} else

		if(AST[i].type == 'ThrowStatement') {
			throw (await runStatement(0, [AST[i].argument], runContext))
		} else

		if(AST[i].type == 'TryStatement') {
			let result
			try {
				result = await runStatement(0, [AST[i].block], runContext)
			} catch (e) {
				if(AST[i].handler) {
					// same as runCall param assignment
					await runAssignment({
						type: 'Identifier',
						name: AST[i].handler.params.name
					}, {
						type: 'Literal',
						value: e
					}, runContext)
				}
			} finally {
				if(AST[i].finally) {
					return await runStatement(0, [AST[i].finally], runContext)
				} else {
					if(runContext.bubbleReturn !== result) {
						console.log('WARNING: not bubbling correctly: ' 
							+ runContext.bubbleStack[runContext.bubbleStack.length - 1])
					}
					return result
				}
			}
		} else
		if(AST[i].type == 'ArrayExpression') {
			let result = []
			for(let j = 0; j < AST[i].elements.length; j++) {
				result.push(await runStatement(0, [AST[i].elements[j]], runContext))
			}
			return result
		} else 


		{
			debugger
			throw new Error(AST[i].type + ': Not implemented!')
		}

	} catch (e) {
		debugger
		doError(e, runContext)
		return
	}
}

// find and run main
async function runBody(AST, runContext) {
	if(await shouldBubbleOut(runContext)) {
		throw new Error('context ended!')
	}

	// TODO: FIX CONTEXTS. THIS IS ONE OF THE THINGS THAT
	//   SERIOUSLY BOTHERS ME ABOUT CHROME DEBUGGER, IF I 
	//   AM IN A DIFFERENT SCOPE LOOKING AT A VARIABLE WITH
	//   THE SAME NAME AS THE SCOPE IT'S PAUSED ON, IT SHOWS
	//   ME THE WRONG SCOPE WHEN I USE THE STACK!

	// TODO: restore outer scope when context was created
	// doesn't need to be fast, because async DevTools calls, are not fast
	// replace with current context

	// any time a setTimer is use the callStack will be reset
	//   which means error messaging must intercept here not to
	//   ruin out worker process
	try {

		let result = await runParameters(AST, runContext)
		if(await shouldBubbleOut(runContext)) {
			return result.pop()
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





