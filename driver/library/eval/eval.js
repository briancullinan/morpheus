// something is wrong with repl
//   it's way too slow
//   let's try something new
// every time I feel like I can make a vast improvement in style
// to test this concept, lets use it from the very beginning

let programThreads = []
let programResponses = []
let programHeap = []

const BOOTSTRAP_CURSOR = 'script'
// using this silly template because no matter
//   what somebody passes from front-end, it gives
//   me the same expression result. it also allows
//   me to use `return` statement inside a "virtual"
//   global section without affecting variables outside
//   of scope, and it allows me to pop the last result 
//   off of the returnStack. this concept was taken 
//   from the ijupyter nodejs kernel. except there, it's 
//   actually using eval, where-as here, its using a 
//   visitor and hacking the scope for real references.
// add aspects to control program stack
const BOOTSTRAP_EVAL = `(
/* @Add(@Program,doBootstrap) */
function () { ${BOOTSTRAP_CURSOR} })()`

const PREAMBLE_LINES = BOOTSTRAP_EVAL
		.split(BOOTSTRAP_CURSOR)[0]
		.split('\n').length

// I had kind of suspected acorn or something has provided a
//   `visitor`. this will make it easy to switch to ANTLR,
//   only replace binding function for callback. then focus
//   on mapping symbol names to pass into javascript parser
//   to reconstruct the correct AST from doing to opposite
//   of this attribute feature supplement we're doing to the
//   stack to generalize it in the first place. do the reverse
//   same as we have onEval, doEval, onMessage, sendMessage
//   onTranspile, doTranspile is make stack change, and reverse 
//   stack change back to language.
function doEval(evalStr) {
	let programCallstack = []
	let accumulatedComments = []
	let comments = []
	let program = acorn.parse(
		BOOTSTRAP_EVAL.replace('script', evalStr), {	
		ecmaVersion: 2020, locations: true, 
		onToken: doComment.bind(null, comments, accumulatedComments),
		onComment: onComment.bind(null, accumulatedComments),
	})
	// await (Promise) for program to finish executing
	// make sure we hit a `Program` first thing
	return new Promise(onInstruction
		.bind(this, {
			// runContext
			programCallstack, program, comments, 
			// this returns with function below removes
		})).then(onEval)
}

// TODO: get rid of repl/accessor
function onEval(abstractNode) {
	if(abstractNode && abstractNode.type == 'Evaluate') {
		return Promise.resolve(node.value())
	}
	// queues up new instructions or pushes onto return stack
	debugger
	doAttributes()
	// TODO: micro manage call stack / return stack, that's all
	if(typeof doNode == 'function') {
		doNode()
	}
		// TODO: doNode() // callback for status reporting?
	return ctx.bubbleReturn[0]
}

// doInstruction pushes AST arguments/left/right 
//   onto stack synchronously as a result of every 
//   async eval or the natural await stack.pop() 
//   at specified FPS. It's a program animator.
// Step by step calculator? this a basic stack based
//   calculator, except parentheses operators has already
//   been simplified for us via the walk.full()
// If we load the full stack infix-posfix the 
//   programCallstack is actually just a list with 
//   a new mirror of doInstruction push operations, 
//   makes it easy to isolate single call-frames 
//   when debugging.
function doInstruction(runContext, abstractNode) {
	// TODO: collect comments here instead of parser? where are they?
	//   higher level language? software nuero-lingistic 
	//   programming?
	// off the program stack, on to call stack, 
	//   same as in CPU memory, but at the...
	let abstractNode = runContext.programCallstack.pop()

if(!evalStr) {
	throw new Error('No program!')
}
if(evalStr.hasOwnProperty('length')) {
	return Promise.resolve(onInstruction(evalStr))
}
if(typeof evalStr != 'string') {
	throw new Error('Don\'t know what to do!')
}

	if(runContext.programCallstack.length != runContext.frameId) {
		throw new Error('Callstack corrupted!')
	}
	runContext.programCallstack.push({
		type: 'Evaluate',
		value: onEval.bind(null, abstractNode)
	})
	// TODO: check for `@NodeAttributes` ?
	//  @Program, do pushes in order of predicates.
	//    implied predicated pushed first to be evaled 
	//    last. add parallelism options this time with
	//    Array.filter() and _Promise replacement as a
	//    part of REPL middleware. evaluator should 
	//    be able to support it this time around.
	// Format: @Program(__name, __callback)
	if(runContext.comments[abstractNode.loc.start]
		&& runContext.comments[abstractNode.loc.start].includes('@')) {
		onAttributes(runContext.programCallstack, 
			runContext.comments, abstractNode)
	}
	if(typeof onNode == 'function') {
		onNode(runContext.programCallstack, 
			runContext.comments, abstractNode)
	}
	walk.simple(abstractNode, doInstruction
		// pass to infix to postfix stack creator
		.bind(null, runContext.programCallstack, comments))

}

// *on - request
// *do - trigger

// onInstruction awaits until stack is cleared
function onInstruction(runContext, resolve, reject) {
	// TODO: return a new call frame
	if(!runContext.programTimer) {
		runContext.programTimer = setInterval(
			// onInstruction is called once, begins
			//   stack frame initialization unto onEval
			//   can be called with a final result and
			//   frame returns to (frame - 1)
			// bind to self for timed execution ?
			doInstruction.bind(null, runContext), 1000/60)
	}
	if (runContext.programCallstack.length < frame) {
		clearInterval(runContext.programTimer)
		if(typeof runContext.error != 'undefined'
			|| runContext.programCallstack.length < frame - 1) {
			console.log('Program error: ', runContext.error)
			return reject(runContext.error)
		}
		return resolve(runContext.async)
	}
	runContext.programCallstack.push(runContext.program.body[0])
	// doInstruction(runContext, )
}

// PROGRAM CALCULATOR IN < 100 LOC WAS 
//   MY GOAL AND MOST OF IT IS COMMENTS.
// Why does this matter? 
// Because the [docs](./docs/eval.md) matches the code
//   exactly. It literally does nothing more than what 
//   I said it was going to do. Everything is self
//   contained inside a functional context, to add
//   REPL features would be the same simple middle-
//   ware pattern to add specific data-types/JSON/ZMQ/COM

