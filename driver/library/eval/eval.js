// something is wrong with repl
//   it's way too slow
//   let's try something new

let programThreads = []
let programResponses = []
let programHeap = []

function doBootstrap(script) {
	let parser =  acorn.parse('(acorn.parse)(script)')
	parser.body[0].expression.arguments[0].type = 'Literal'
	parser.body[0].expression.arguments[0].value = script
	return doEval({ body: parser.body[0], script: script })
}

function doEval(runContext) {
	console.log('eval: ' + runContext.script)
	// convert entire eval repl to a single program stack
	//   this might help with debugging because then it is flat
	//   no branching to await calls
	if(!runContext.body) {
		// TODO: move doBootstrap here so I don't have to put anything more in Makefile
		let program = acorn.parse('(' + doBootstrap + ')(script)', 
				{ecmaVersion: 2020, locations: true, onComment: []})
		// convert infix to postfix, in order to simplify processing
		// TODO: I REALLY WISH I COULD VISUALIZE THE DIFFERENCE IN AST-DIRECTIONAL GRAPH
		//   MAYBE ONCE IT'S UP AN RUNNING I CAN USE D3.JS FROM LIBRARY.
		// THE DIFFERENCE BETWEEN LOOKING AT IT TOP DOWN USING POSTFIX SHOULD
		//   PROVIDE SOME CLUES TO SINKS BECAUSE IT PUTS ALL OF THE ENDPOINTS
		//   IN LEAVES INSTEAD OF AT THE BOTTOM OF A TOP DOWN GRAPH, THE LEAVES
		//   TURN IN TO ACTUAL REFERENCES IN CODE, AS OPPOSED TO USE INSTANCES
		// ITS LIKE LOOKING AT CODE LIKE A GARBAGE COLLECTOR INSTEAD OF A SINK.
		//   SHOULD EVEN BE ABLE TO GRAPH OUT OVERRIDING VARIABLE NAMES, COLLISIONS
		//   SCOPE BREAKING WHERE WE ACCIDENTALLY LEAVE A VARIABLE OUTSIDE A SCOPE
		//   BUT DON'T GET AN `ERR`, RAN IN TO THAT WITH EMSCRIPTEN, SOME GLOBALLY 
		//   DEFINED ERR, SO ANY TIME I USE ERR IN MY CODE BY ACCIDENT, IT REFERS 
		//   TO THE WRONG ONE!
		// TODO: HEY CHROME DEBUGGER! I PICK ON THEM A LOT. COULD USE THIS "PROGRAM TREE"
		//   AS A PERMANENT CALL STACK INSTEAD OF TRYING TO LOAD CRAP AND SWITCH THINGS AROUND
		//   USE THE PROGRAM TREE AS A TABLE OF CONTENTS AND HIGHLIGHT THE ROWS THAT ARE IN
		//   IN THE CALL WHEN I CLICK ON IT, THEN USE SOME OTHER INDICATION TO NAVIGATE LINES.
		runContext.body = program.body[0]
	}
	return awaitProgram(runContext.body, runContext)
}

let currentContext

function awaitProgram(program, runContext) {
	if(typeof runContext == 'undefined') {
		runContext = currentContext
	}
	// to test this concept, lets use it from the very beginning
	if(typeof runContext.programCallstack == 'undefined') {
		runContext.bubbleReturn = [void 0]
		runContext.continueOnError = true
		runContext.programCallstack = []
		runContext.programCount = 0
		runContext.localDeclarations = [
			globalThis,
			runContext,
			{}
		]
	} else {
		throw new Error('Don\'t know what to do!')
	}
	// program continues until it is stopped or 
	//   errors or program stack is emptied
	console.log('timer started')
	runContext.programTimer = setInterval(
		programCounter.bind(null, runContext.programCallstack.length, runContext), 1000/60)
	return new Promise(function (resolve, reject) {
		runContext.programId = programThreads.length
		programThreads.push(runContext)
		programResponses.push({resolve, reject})
		runContext.programCallstack.push(program)
	})
}


function cleanupProgram(runContext) {
	runContext.ended = true
	runContext.returned = false
	clearInterval(runContext.programTimer)
	let programI = programThreads.indexOf(runContext)
	programThreads.splice(programI, 1)
	let {resolve, reject} = programResponses.splice(programI, 1)[0]
	debugger
	if(typeof runContext.error != 'undefined') {
		return reject(runContext.error)
	} else {
		return resolve(runContext.bubbleReturn[0])
	}
}


function shouldBubbleOut(AST, callFrame, runContext) {
	if(runContext.continueOnError && runContext.error) {
		// clear error for non member statements
		//   otherwise member access will take care of it
		if(AST 
				&& AST.type == 'Identifier' 
				&& AST.type != 'Literal'
				&& AST.type != 'MemberExpression'
				&& AST.type != 'AssignmentExpression'
				// TODO: add error remover to CallExpression
				//&& AST.type != 'CallExpression'
		) {
		//if(runContext.programCount) {
			// TODO: callback somewhere?
			//console.error(runContext.error)
			//delete runContext.error
			//runContext.programCallstack.pop()
			//runContext.programCount--
		}
	}
	return runContext.programCount - callFrame == -1
			|| (typeof runContext.error != 'undefined'
					&& !runContext.continueOnError)
}

// CODE REVIEW, FINALLY FOUND A WAY TO TEST A PROGRAMMING LANGUAGE FOR FEATURE COMPLETENESS
//   ADDING TO THIS SWITCH LIST, AND USING THE PROGRAM COUNTER, IT BREAKS EVERY TIME A
//   POLYFILL IS NOT MANIPULATING THE PROGRAM STACK CORRECTLY.
//   THIS WAY I CAN ADD ASPECTS (BEFORE/AFTER) CALLS LIKE TRACKING TIMERS
//   AND GAURANTEE THE STACK DOESN'T GET CORRUPTED.
// TODO: NEED TO DO THE SAME THING FOR RETURN STATEMENTS, EVERY EXPRESSION
//   PUSHES A RETURN VALUE, AND THEN POP IT OFF IF IT ISN'T USED IN THE NEXT STATEMENT
//   CAN ONLY HAVE 1 THING IN RETURN STACK WHEN RETURN STATEMENT IS EVALUATED
//   THAT MEANS ALL THE OTHER TOKEN TYPES CLEARED THE EXTRA CALL FRAME VALUES
//   THEY STORED (I.E. LEFT/RIGHT)
// CODE REVIEW, OH GOD, SO MUCH LESS CODE. IMAGINE REPLACING ALL OF BABEL
//   GULP, THE WHOLE NODE ECOSYSTEM CAN BE EVOLVED WITH SO MUCH SMALLER
//   VISITOR CODE. NOW ADDING IN MY SYNTAX SERVICE, I CAN APPEND ANY FUNCTION
//   IN THE NODE API WITH MY OWN PRECURSORS, IMAGINE CONTEXTUALIZED FILE-SYSTEMS
// WHERE THE SAME CODE RUNS BUT IN ONE ENVIRONMENT IT'S READING FROM MEMFS, AND
//   ONE ENVIRONMENT IT'S READING FROM ZFS. LIKE DEPENDENCY INJECTION ON STEROIDS.
//   IT'S LIKE THE ASPECTS CHANGE DEPENDENCIES ON THE FLY.
function programCounter(callFrame, runContext) {
	currentContext = runContext
	//if(runContext.programCount > callFrame) { // waiting for something
	//  return
	//}
	// INTERESTING IT APPEARS TO BE CONTINUING ON ERROR, 
	//   I SHOULD PRESERVE THAT FUNCTIONALITY AS A FEATURE
	if(runContext.programCallstack.length > 0
		&& runContext.programCallstack[
			runContext.programCallstack.length-1].stillRunning) {
		return
	}
	let AST = runContext.programCallstack.pop()
	if(shouldBubbleOut(AST, callFrame, runContext)) {
		return cleanupProgram(runContext)
	}
	if(runContext.programCount != runContext.programCallstack.length) {
		debugger
		throw new Error('Call stack exceeded!')
	}
	// TODO: control how many commands it calls every frame?
	console.log('Thread ' + runContext.programId, AST.type)
	switch(AST.type) {
		case 'Evaluate': 
			// prevent the program from doing anything unless the stack changes
			if(AST.stillRunning) {
				runContext.programCallstack.push(AST)
				return
			}
			AST.stillRunning = true
			runContext.programCount -= 1
			Promise.resolve(AST.value.apply(AST))
			break
		case 'Identifier':
			console.log(AST.name)
			if(AST.name == 'acorn') {
				debugger
			}
			// TODO: check if local and don't take another frame
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (idName) {
					for(let i = runContext.localDeclarations.length-1; i >= 0; --i) {
						let locals = runContext.localDeclarations[i]
						if(locals.hasOwnProperty(idName)) {
							runContext.bubbleReturn.push(locals[idName])
							return
						}
					}
					// TODO: insert remote middleware, on failure
					runContext.bubbleReturn.push(void 0)
					runContext.error = new Error('Identifier not defined: ' + idName)
				}).bind(null, AST.name)
			})
			break
		case 'MemberExpression':
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (member) {
					let property
					if(member.computed) {
						property = runContext.bubbleReturn.pop()
					} else {
						property = member.property.name
					}
					let object = runContext.bubbleReturn.pop()
					if(!object && runContext.error) {
						console.error(runContext.error)
						delete runContext.error
						// assume it's handled until it isn't
						runContext.bubbleReturn.push(void 0)
						return
					}
					// TODO: push async propery eval and 
					// runContext.programCount += 1
					// CODE REVIEW, SEE CONTROL IS EASIER IN 1 LOOP
					runContext.bubbleReturn.push(object[property])
				}).bind(null, AST)
			})
			if(AST.computed) {
				runContext.programCount += 2
				// need object on bubbleReturn stack first
				runContext.programCallstack.push(AST.property) 
			} else {
				runContext.programCount += 1
			}
			runContext.programCallstack.push(AST.object)
			break
		case 'Literal':
			// interesting, showing a literal move from program memory to 
			//   heap?
			runContext.programCount--
			runContext.bubbleReturn.push(AST.value)
			break
		case 'CallExpression':
			let reEvaluate
			reEvaluate = {
				type: 'Evaluate',
				value: function () {
					// pop this guy back onto the stack because it's async
					//   it will clear when async finalizes
					console.assert(reEvaluate.type == 'Evaluate')
					runContext.programCount++
					runContext.programCallstack.push(reEvaluate)
					let params
					// WEIRD I JUST GOT CONFUSED WHERE WHAT GENERATING AN ERROR BECAUSE IT'S WORKING
					if(AST.arguments.length != 0) {
						params = runContext.bubbleReturn.splice(-AST.arguments.length)
					} else {
						params = []
					}
					let callee = runContext.bubbleReturn.pop()
					return Promise.resolve((async function () {
					let result 
					try {
						result = await callee(...params)
					} catch (e) {
						// TODO: bubble out to TryCatch properly
						runContext.error = e
					} finally {
						// need a little bit of screwarounds incase the call actually
						//   makes stack changes. this prevents the runner from doing anything
						//   even if it's called multiple times
						runContext.programCount--
						runContext.programCallstack.pop()
						runContext.bubbleReturn.push(result)
						return result
					}
					})())
				}
			}
			runContext.programCallstack.push(reEvaluate)
			for(let i = 0; i < AST.arguments.length; i++) {
				runContext.programCount += 1
				runContext.programCallstack.push(AST.arguments[i])
			}
			// CODE REVIEW, I made a change where each token doesn't
			//   have to make the same stack/counter changes and forgot this one
			runContext.programCount += 1
			runContext.programCallstack.push(AST.callee)
			break
		case 'ReturnStatement':
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: function () {
					debugger
					// coming out of every function can have only 1
					//   return value from processing the argument command below
					//   everything else should clear their own values, when they 
					//   are Evaled
					if(runContext.bubbleReturn.length != 1) {
						debugger
						throw new Error('Thread ' + runContext.programId + ': Corrupted stack.')
					}
					// TODO: exit whole frame
					//runContext.bubbleReturn.push(globalThis[AST.name])
				}
			})
			runContext.programCount += 1
			runContext.programCallstack.push(AST.argument)
			break
		case 'FunctionExpression':
			// TODO: copy creation context
			// return a function?
			runContext.programCount -= 1 // because we are adding a return statement
			// not adding an Evaluate command so need to subtract 1
			runContext.bubbleReturn.push((function (body, params, ...args) {
				// TODO: assign params and defaults
				debugger
				//runContext.programCallstack = []
				// implied assignment expression
				// TODO: Evaluate body after params?
				runContext.programCount += 1
				runContext.programCallstack.push(body)
				for(let i = params.length-1; i >= 0; --i) {
					runContext.programCount += 1
					runContext.programCallstack.push({
						type: 'AssignmentExpression',
						left: { type: 'Identifier', name: params[i].name },
						right: { type: 'Literal', value: args[i] },
					})
				}
			}).bind(null, AST.body, AST.params))
			break
		case 'ExpressionStatement':
			// so going into every expression can have a
			//   maximum of one return value from previous
			//   statement/exp/call
			if(runContext.bubbleReturn.length != 1) {
				debugger
				throw new Error('Thread ' + runContext.programId + ': Corrupted stack.')
			}
			runContext.bubbleReturn.pop()
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (expression) {
					runContext.programCount += 1
					runContext.programCallstack.push(expression)
					// TODO: make a change like implied return? 

				}).bind(null, AST.expression)
			})
			break
		case 'BlockStatement':
			// TODO: create context on stack
			runContext.programCount -= 1
			runContext.programCount += AST.body.length
			for(let i = AST.body.length-1; i >= 0; i--) {
				runContext.programCallstack.push(AST.body[i])
			}
			break
		case 'BinaryExpression':
			// TODO: THIS WILL ALLOW ME TO TRANSFORM ARRAY.FILTER() INTO PARALLEL PROMISES?
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: function () {
					runContext.programCallstack.splice(-3)
					let left = runContext.bubbleReturn.pop()
					let right = runContext.bubbleReturn.pop()
					runContext.bubbleReturn.push(left + right)
				}
			})
			runContext.programCount += 1
			runContext.programCallstack.push(AST.right)
			runContext.programCount += 1
			runContext.programCallstack.push(AST.left)
			break
		case 'VariableDeclaration':
			runContext.programCount -= 1
			runContext.programCount += AST.declarations.length
			for(let i = 0; i < AST.declarations.length; i++) {
				runContext.programCallstack.push(AST.declarations[i])
			}
			break
		case 'VariableDeclarator':
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (varName) {
					runContext.localDeclarations[runContext.localDeclarations.length-1]
							[varName] = runContext.bubbleReturn.pop()
				}).bind(null, AST.id.name)
			})
			runContext.programCount += 1
			runContext.programCallstack.push(AST.init)
			break
		case 'AssignmentExpression':
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (assignee) {
					if(assignee.type == 'MemberExpression') {
						let object = runContext.bubbleReturn.pop()
						object[assignee.property.name] 
								= runContext.bubbleReturn[runContext.bubbleReturn.length-1]
					} else if (assignee.type == 'Identifier') {
						runContext.localDeclarations[runContext.localDeclarations.length-1]
							[assignee.name] = runContext.bubbleReturn[runContext.bubbleReturn.length-1]
					}
					if(runContext.error) {
						console.error(runContext.error)
						delete runContext.error
					}
					// TODO: insert remote middleware
				}).bind(null, AST.left)
			})
			if(AST.left.type == 'MemberExpression') {
				runContext.programCount += 1
				runContext.programCallstack.push(AST.left.object)
			} else if (AST.left.type == 'Identifier') {

			} else {
				throw new Error(AST.type + ': Not implemented: ' + AST.left.type)
			}
			runContext.programCount += 1
			runContext.programCallstack.push(AST.right)
			break
		case 'ObjectExpression':
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (object) {
					let result = {}
					for(let k = object.properties.length-1; k >= 0; --k) {
						if(AST.properties[k].value) {
							result[AST.properties[k].key.name] = runContext.bubbleReturn.pop()
						} else {
							result[AST.properties[k].key.name] = void 0
						}
					}
					runContext.bubbleReturn.push(result)
				}).bind(null, AST)
			})
			// TODO: paralell object initializers?
			for(let k = AST.properties.length-1; k >= 0; k--) {
				if(AST.properties[k].value) {
					runContext.programCount += 1
					runContext.programCallstack.push(AST.properties[k].value)
				}
			}
			break
		/*
		case 'Property':
			runContext.programCallstack.pop()
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (object) {
					debugger
					runContext.programCount -= 1
					runContext.programCallstack.pop()
				}).bind(null, )
			})
		*/
		default: 
			debugger
			throw new Error(AST.type + ': Not implemented!')
	}
}




