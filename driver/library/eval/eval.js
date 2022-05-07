// something is wrong with repl
//   it's way too slow
//   let's try something new

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
const BOOTSTRAP_EVAL = `( // @Add(@Program,doBootstrap)
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
	let accumulatedComments = []
	let comments = []
	let program = acorn.parse(
		BOOTSTRAP_EVAL.replace('script', evalStr), {	
		ecmaVersion: 2020, locations: true, 
		onToken: doComment.bind(null, comments, accumulatedComments),
		onComment: onComment.bind(null, accumulatedComments),
	})
	// make sure we hit a `Program` first thing
	walk.full(program, 
		// pass to infix to postfix stack creator
		doInstruction.bind(null, programCallstack, comments))
	// await (Promise) for program to finish executing
	return onInstruction(programCallstack, program).then(onEval)
}

// every time I feel like I can make a vast improvement in style
// to test this concept, lets use it from the very beginning
function doComment(comments, accumulatedComments, token) {
	let commentLength = accumulatedComments.length
	comments[token.start] = accumulatedComments.splice(0)
	console.assert(comments[token.start].length == commentLength)
}
function onComment(accumulatedComments, _, comment) {
	accumulatedComments.push(comment)
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
function doInstruction(programCallstack, comments) {
	//   higher level language? software nuero-lingistic 
	//   programming?
	// off the program stack, on to call stack, 
	//   same as in CPU memory, but at the...
	let abstractNode = programCallstack.pop()
	programCallstack.push({
		type: 'Evaluate',
		value: onEval.bind(null, abstractNode)
	})
	// TODO: check for `NodeAttributes` ?
	//  @Program, do pushes in order of predicates.
	//    implied predicated pushed first to be evaled 
	//    last. add parallelism options this time with
	//    Array.filter() and _Promise replacement as a
	//    part of REPL middleware. evaluator should 
	//    be able to support it this time around.
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


// onInstruction awaits until stack is cleared
function onInstruction(programCallstack, program) {
	// TODO: return a new call frame
	if(!runContext.programTimer) {
		runContext.programTimer = setInterval(
			runStatement.bind(null, runContext, resolve, reject))
	}
	if(stack.length < frame - 1) {
		clearInterval(runContext.programTimer)
		throw new Error('Program error: ', runContext.error)
	} else if (stack.length < frame) {
		clearInterval(runContext.programTimer)
		if(typeof runContext.error != 'undefined') {
			return reject(runContext.error)
		} else {
			return resolve(runContext.bubbleReturn.pop())
		} 
	}
}

// TODO: get rid of repl/accessor
function onEval(node) {
	if(node && node.type == 'Evaluate') {
		return Promise.resolve(node.value())
	}
	// TODO: manage call stack / return stack, that's all
	return ctx.bubbleReturn[0]
}
