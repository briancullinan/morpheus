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
	return doEval({ body: program.body[0] })
}

function doEval(runContext) {

	// convert entire eval repl to a single program stack
	//   this might help with debugging because then it is flat
	//   no branching to await calls
	if(!runContext.body) {
		
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
		runContext.bubbleReturn = []
		runContext.continueOnError = true
		runContext.programCallstack = []
		runContext.programCount = 0
		runContext.localDeclarations = [
			globalThis,
			{}
		]
	}
	// program continues until it is stopped or 
	//   errors or program stack is emptied
	runContext.programTimer = setInterval(
		programCounter.bind(null, runContext.programCallstack.length, runContext), 1000/60)
	return new Promise(function (resolve, reject) {
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
	return !AST
			|| runContext.programCount - callFrame == -1
			|| (typeof runContext.error != 'undefined'
					&& !runContext.continueOnError)
}


function programCounter(callFrame, runContext) {
	currentContext = runContext
	//if(runContext.programCount > callFrame) { // waiting for something
	//  return
	//}
	// INTERESTING IT APPEARS TO BE CONTINUING ON ERROR, 
	//   I SHOULD PRESERVE THAT FUNCTIONALITY AS A FEATURE
	let AST = runContext.programCallstack.pop()
	if(shouldBubbleOut(AST, callFrame, runContext)) {
		return cleanupProgram(runContext)
	}
	if(runContext.programCount < 0
		|| runContext.programCount > runContext.programCallstack.length) {
		debugger
		throw new Error('Call stack exceeded!')
	}
	// TODO: control how many commands it calls every frame?
	switch(AST.type) {
		case 'Evaluate': 
			// prevent the program from doing anything unless the stack changes
			if(AST.stillRunning) {
				return
			}
			AST.stillRunning = true
			runContext.programCount -= 1
			Promise.resolve(AST.value.apply(AST))
			break
		case 'Identifier':
			// TODO: check if local and don't take another frame
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (idName) {
					for(let i = 0; i < runContext.localDeclarations.length; i++) {
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
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: async function () {
					let that = this
					let params
					// WEIRD I JUST GOT CONFUSED WHERE WHAT GENERATING AN ERROR BECAUSE IT'S WORKING
					if(AST.arguments.length != 0) {
						params = runContext.bubbleReturn.splice(-AST.arguments.length)
					} else {
						params = []
					}
					let callee = runContext.bubbleReturn.pop()
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
						runContext.bubbleReturn.push(result)
						return result
					}
				}
			})
			for(let i = 0; i < AST.arguments.length; i++) {
				runContext.programCount += 1
				runContext.programCallstack.push(AST.arguments[i])
			}
			runContext.programCallstack.push(AST.callee)
			break
		case 'ReturnStatement':
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: function () {
					debugger
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
			runContext.bubbleReturn.push((function (body, params, ...args) {
				// TODO: assign params and defaults
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
			// TODO: make a change like implied return? 
			runContext.programCallstack.push({
				type: 'Evaluate',
				value: (function (expression) {
					runContext.programCount += 1
					runContext.programCallstack.push(expression)
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
					debugger
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
					for(let k = 0; k < object.properties.length; k++) {
						if(AST.properties[k].value) {
							result[AST.properties[k].key.name] = runContext.bubbleReturn.pop()
						} else {
							result[AST.properties[k].key.name] = void 0
						}
					}
					debugger
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




