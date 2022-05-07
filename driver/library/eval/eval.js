// something is wrong with repl
//   it's way too slow
//   let's try something new

let programThreads = []
let programResponses = []
let programHeap = []


// #####################  TODO:  replMiddleware

// TODO: put this inside a template string inside 
//   doEval() so I don't have to edit Makefile
function doBootstrap(script) {
	let acornParse = '(acorn.parse)(script)'
	let parser =  acorn.parse(acornParse)
	parser.body[0].expression.arguments[0].type = 'Literal'
	parser.body[0].expression.arguments[0].value = script
	let program = doEval({ body: parser.body[0], script: acornParse })
	return doEval({ body: program.body[0], script: acornParse })
	// doEval({ body: program.body[0], script: script })
}

function doEval(runContext) {
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
	} else {
		console.log('eval: ' + runContext.script)
	}
	doEval.interpreted = true
	return awaitProgram(runContext.body, runContext)
}

let currentContext

function awaitProgram(program, runContext) {
	if(typeof runContext == 'undefined') {
		runContext = currentContext
	}
	// to test this concept, lets use it from the very beginning
	if(typeof runContext.bubbleReturn == 'undefined') {
		runContext.bubbleReturn = new Array(programThreads.length + 1).fill(void 0)
		runContext.continueOnError = true
		runContext.localDeclarations = [
			globalThis,
			runContext,
			{}
		]
	} else {
		runContext.bubbleReturn.push(void 0)
		//debugger
		//throw new Error('Don\'t know what to do!')
		console.assert(runContext.bubbleReturn.length == programThreads.length + 1)
	}
	// program continues until it is stopped or 
	//   errors or program stack is emptied
	console.log('timer started')
	// always keep at least 1 void so we know where -1 is (aka null)
	let programCallstack = new Array(programThreads.length + 1).fill(void 0)
	runContext.programTimer = setInterval(
		programCounter.bind(null, {
			programCallstack: programCallstack,
			callFrame: programThreads.length + 1,
			runContext: runContext,
		}), 1000/60)
	return new Promise(function (resolve, reject) {
		if(program.hasOwnProperty('length')) {
			for(let i = program.length-1; i >= 0; --i) {
				programCallstack.push(program[i])
			}
		} else {
			programCallstack.push(program)
		}
		programThreads.push(runContext)
		programResponses.push({resolve, reject})
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
		return resolve(runContext.bubbleReturn.pop())
	}
}

// #####################  TODO:  replMiddleware

function onEval(runContext, AST, ...exp) {
	console.log('Thread ' + runContext.programTimer, 
		'Evaluate.' + AST.type)
	//console.log(...exp)
}


function beforeSymbol(AST, programCallstack, frame, runContext) {
	// TODO: add attribute modifiers
	// TODO: VISUALIZING THIS SHOULD HELP DEBUG TOO LARGE PARAMETER PASSING
	//   AND THE KIND OF PLACES THAT THINGS LIKE CLOJURE CAN TREE-FOLD OUT.
	let nameStr = ''
	if(AST.type == 'CallExpression') {
		// TODO: need to recompile specific expressions for this purpose?
		//   how to convert AST back to code without importing esprima?

	} else 
	if(AST.type == 'Evaluate') {

	} else 
	if(AST.type == 'Identifier') {
		nameStr = ' . I-name: ' + AST.name
	}
	let rValues = ' . R-values: '
	if(runContext.bubbleReturn.length == 1
		&& typeof runContext.bubbleReturn[runContext.bubbleReturn.length-1] == 'undefined'
		) {
			rValues += 'void'
	} else {
		rValues +=  runContext.bubbleReturn.length
	}

	console.log('Thread ' + runContext.programTimer,
		' . S-length: ' + programCallstack.length,
		' . C-frame: ' + frame,
		' . A-type: ' + AST.type,
		rValues,
		nameStr,
		/*+ ', P-codes: ' + programCallstack
		.slice(AST.frameStart, AST.frameEnd)
		.map(function (symbol) {return symbol.type})
		.join(' . ')
		*/
		)
}


function shouldBubbleOut(AST, programCallstack, callFrame, runContext) {
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
		//if(programCount) {
			// TODO: callback somewhere?
			//console.error(runContext.error)
			//delete runContext.error
			//programCallstack.pop()
			//programCount--
		}
	}
	return programCallstack.length < callFrame
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
function programCounter({programCallstack, callFrame, runContext}) {
	currentContext = runContext
	//if(programCount > callFrame + 1) { // waiting for something
	//  return
	//}
	// INTERESTING IT APPEARS TO BE CONTINUING ON ERROR, 
	//   I SHOULD PRESERVE THAT FUNCTIONALITY AS A FEATURE
	// TODO: move to before symbol
	if(programCallstack.length > 0
		// TODO: CODE REVIEW, too much hardening?
		&& programCallstack[
			programCallstack.length-1]
		&& programCallstack[
			programCallstack.length-1].stillRunning) {
		return
	}
	let AST = programCallstack.pop()
	if(shouldBubbleOut(AST, programCallstack, callFrame, runContext)) {
		return cleanupProgram(runContext)
	}
	// TODO: control how many commands it calls every frame?
	// TODO: add @Function(__name, __func) // symbol attributes
	// TODO: add @Identifier(__name, __func) // symbol attributes
	beforeSymbol(AST, programCallstack, callFrame, runContext)
	AST.frameStart = programCallstack.length
	switch(AST.type) {
		// TODO: seperate VISITOR code from 
		// type: 'Evaluate' evalIdentifier() callbacks
		case 'Evaluate': 
			// prevent the program from doing anything unless the stack changes
			if(AST.stillRunning) {
				programCallstack.push(AST)
			} else {
				AST.stillRunning = true
				Promise.resolve(AST.value.apply(AST))
			}
			break
		case 'Identifier':
			if(AST.name == 'acorn') {
				//debugger
			}
			// TODO: check if local and don't take another frame
			programCallstack.push({
				type: 'Evaluate',
				value: (function (identifier, idName) {
					onEval(runContext, identifier)
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
				}).bind(null, AST, AST.name)
			})
			break
		case 'MemberExpression':
			programCallstack.push({
				type: 'Evaluate',
				// TODO: NEED A WAY TO SET EXPECTATIONS BETWEEN REMOTE SERVICES
				//   IF I DO THIS ON A LANGUAGE LEVEL, LIKE MEMBER EXPRESSION -> CALL EXPRESSION
				//   MAYBE I WILL NEVER HAVE TO DEAL WITH MISSING DATA AGAIN AT A HIGHER LEVEL
				//   IT IS JUST ASSUMED BY MY BASIC TYPES (I.E. VOID 0) VOIDZERO Good name for project?
				value: (function (member) {
					onEval(runContext, member)
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
					// CODE REVIEW, SEE CONTROL IS EASIER IN 1 LOOP
					runContext.bubbleReturn.push(object[property])
				}).bind(null, AST)
			})
			if(AST.computed) {
				// need object on bubbleReturn stack first
				programCallstack.push(AST.property) 
			} else {
			}
			programCallstack.push(AST.object)
			break
		case 'Literal':
			// interesting, showing a literal move from program memory to 
			//   heap?
			runContext.bubbleReturn.push(AST.value)
			break
		case 'CallExpression':

			if(runContext.bubbleReturn.length != callFrame) {
				debugger
				// something it's putting it's previous result back on the stack
				//   used in situations like `if((assignee = value))`
				throw new Error('Thread ' + runContext.programTimer + ': Corrupted stack.')
			}

			let reEvaluate
			reEvaluate = {
				type: 'Evaluate',
				value: (function (call) {
					onEval(runContext, call)

					let params = []
					// WEIRD I JUST GOT CONFUSED WHERE WHAT GENERATING AN ERROR BECAUSE IT'S WORKING
					if(AST.arguments.length != 0) {
						for(let i = 0; i < AST.arguments.length; i++) {
							params.push(runContext.bubbleReturn.pop())
						}
					}

					let callee = runContext.bubbleReturn.pop()
					if(typeof callee != 'function') {
						debugger
						throw new Error('Thread ' + runContext.programTimer + ':Callee is not a function.')
					}

					if(runContext.bubbleReturn.length != callFrame) {
						debugger
						// something it's putting it's previous result back on the stack
						//   used in situations like `if((assignee = value))`
						throw new Error('Thread ' + runContext.programTimer + ': Corrupted stack.')
					}
					// TODO: we're not using the previous return result, unless
					//   I wanted to override Promise functionality?
					runContext.bubbleReturn.pop()

					// pop this guy back onto the stack because it's async
					//   it will clear when async finalizes
					console.log('Thread ' + runContext.programTimer + ': call: ', callee, params)
					console.assert(reEvaluate.type == 'Evaluate')
					programCallstack.push(reEvaluate)
					Promise.resolve(callee(...params))
					.catch(function (e) { runContext.error = e; return e })
					.then(function (result) {
						console.log('Thread ' + runContext.programTimer + ': result: ', result)
						// need a little bit of screwarounds incase the call actually
						//   makes stack changes. this prevents the runner from doing anything
						//   even if it's called multiple times
						programCallstack.pop() // remove async Evaluate
						if(callee && callee.interpreted) {
							//runContext.bubbleReturn.pop() // void 0?
							//if(result !== runContext.bubbleResult) {
							//	console.error('Thread ' + runContext.programTimer + ': Not bubbling correctly.')
							//}
						} else {
							
						}
						runContext.bubbleReturn.push(result)
						return result
					})

				}).bind(null, AST)
			}
			programCallstack.push(reEvaluate)
			for(let i = AST.arguments.length-1; i >= 0; --i) {
				programCallstack.push(AST.arguments[i])
			}
			// CODE REVIEW, I made a change where each token doesn't
			//   have to make the same stack/counter changes and forgot this one
			programCallstack.push(AST.callee)
			break
		case 'ReturnStatement':
			programCallstack.push({
				type: 'Evaluate',
				value: (function (statement) {
					onEval(runContext, statement)
					console.log('return: ', runContext.bubbleReturn[runContext.bubbleReturn.length-1])
					// coming out of every function can have only 1
					//   return value from processing the argument command below
					//   everything else should clear their own values, when they 
					//   are Evaled
					let result = runContext.bubbleReturn.pop()
					if(runContext.bubbleReturn.length != callFrame) {
						debugger
						throw new Error('Thread ' + runContext.programTimer + ': Corrupted stack.')
					}
					debugger
					return result
					// TODO: exit whole frame
					//runContext.bubbleReturn.push(globalThis[AST.name])
				}).bind(null, AST)
			})
			programCallstack.push(AST.argument)
			break
		case 'FunctionExpression':
			// TODO: copy creation context
			// return a function?
			// not adding an Evaluate command so need to subtract 1
			let newInterpretedFunction = (function (interpretedFunction, body, params, ...args) {
				// evaluate body after params?
				let newProgram = []
				// implied assignment expression
				// assign params and defaults
				for(let i = params.length-1; i >= 0; --i) {
					newProgram.push({
						type: 'AssignmentExpression',
						left: { type: 'Identifier', name: params[i].name },
						right: { type: 'Literal', value: args[i] },
					})
				}
				newProgram.push(body)
				// leave an extra void 0 in front like a chip call frame
				let beforeLength = runContext.bubbleReturn.length
				runContext.bubbleReturn.push(void 0)
				return Promise.resolve(awaitProgram(newProgram, runContext))
				.then(function (result) {
					debugger
					console.assert(runContext.bubbleReturn.length == beforeLength)
					console.assert(runContext.bubbleReturn.pop() == void 0)
					runContext.bubbleReturn.push(result)
					return result
				})

			}).bind(null, AST, AST.body, AST.params)
			newInterpretedFunction.interpreted = true
			runContext.bubbleReturn.push(newInterpretedFunction)
			break
		case 'ExpressionStatement':
			// so going into every expression can have a
			//   maximum of one return value from previous
			//   statement/exp/call
			if(runContext.bubbleReturn.length != callFrame) {
				debugger
				throw new Error('Thread ' + runContext.programTimer + ': Corrupted stack.')
			}
			programCallstack.push({
				type: 'Evaluate',
				value: (function (statement, expression) {
					onEval(runContext, statement)
					programCallstack.push(expression)
					// TODO: make a change like implied return? 
					// TODO: discard previous statement so every token doesn't need to?
					//runContext.bubbleReturn.pop()

				}).bind(null, AST, AST.expression)
			})
			break
		case 'BlockStatement':
			// TODO: something to do with promises?
			if(runContext.bubbleReturn.length != callFrame) {
				debugger
				throw new Error('Thread ' + runContext.programTimer + ': Corrupted stack.')
			}
			// TODO: create context on stack
			for(let i = AST.body.length-1; i >= 0; i--) {
				programCallstack.push(AST.body[i])
			}
			break
		case 'BinaryExpression':
			// TODO: THIS WILL ALLOW ME TO TRANSFORM ARRAY.FILTER() INTO PARALLEL PROMISES?
			programCallstack.push({
				type: 'Evaluate',
				value: (function (expression) {
					onEval(runContext, expression)
					let left = runContext.bubbleReturn.pop()
					let right = runContext.bubbleReturn.pop()
					runContext.bubbleReturn.push(left + right)
				}).bind(null, AST)
			})
			programCallstack.push(AST.left)
			programCallstack.push(AST.right)
			break
		case 'VariableDeclaration':
			for(let i = 0; i < AST.declarations.length; i++) {
				programCallstack.push(AST.declarations[i])
			}
			if(runContext.bubbleReturn.length < callFrame) {
				//runContext.bubbleReturn.push(void 0)
			}
			break
		case 'VariableDeclarator':
			programCallstack.push({
				type: 'Evaluate',
				value: (function (declaration, varName) {
					onEval(runContext, declaration)
					runContext.localDeclarations[runContext.localDeclarations.length-1]
							[varName] = runContext.bubbleReturn.pop()

					// i think (let i = 0) == undefined? no?
					if(runContext.bubbleReturn.length < callFrame) {
						runContext.bubbleReturn.push(void 0)
						// declarations have no return statement
					}

				}).bind(null, AST, AST.id.name)
			})
			programCallstack.push(AST.init)
			break
		case 'AssignmentExpression':
			if(runContext.bubbleReturn.length != callFrame) {
				debugger
				throw new Error('Thread ' + runContext.programTimer + ': Corrupted stack.')
			}
			runContext.bubbleReturn.pop()
			programCallstack.push({
				type: 'Evaluate',
				value: (function (expression, assignee) {
					onEval(runContext, expression)
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
				}).bind(null, AST, AST.left)
			})
			if(AST.left.type == 'MemberExpression') {
				programCallstack.push(AST.left.object)
			} else if (AST.left.type == 'Identifier') {

			} else {
				// TODO: runContext.error = 
				throw new Error(AST.type + ': Not implemented: ' + AST.left.type)
			}
			programCallstack.push(AST.right)
			break
		case 'ObjectExpression':
			programCallstack.push({
				type: 'Evaluate',
				value: (function (object) {
					onEval(runContext, object)
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
					programCallstack.push(AST.properties[k].value)
				}
			}
			break
		/*
		case 'Property':
			programCallstack.pop()
			programCallstack.push({
				type: 'Evaluate',
				value: (function (object) {
					debugger
					programCallstack.pop()
				}).bind(null, )
			})
		*/
		default: 
			debugger
			throw new Error(AST.type + ': Not implemented!')
	}
	AST.frameEnd = programCallstack.length
}




