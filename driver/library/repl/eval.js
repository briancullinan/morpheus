// something is wrong with repl
//   it's way too slow
//   let's try something new
// every time I feel like I can make a vast improvement in style
// to test this concept, lets use it from the very beginning

let programThreads = []
let programResponses = []
let programHeap = []

// *on - request
// *do - trigger

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
function doEval(runContext, evalStr) {
	Object.assign(runContext, {
		bubbleReturn: [],
		programCallstack: [],
		accumulatedComments: [],
		comments: [],
	}, runContext)
	runContext.program = acorn.parse(
		BOOTSTRAP_EVAL.replace('script', evalStr), {	
		ecmaVersion: 2020, locations: true, 
		onToken: doComment.bind(null, 
			runContext.comments, 
			runContext.accumulatedComments),
		onComment: onComment.bind(null, 
			runContext.accumulatedComments),
	})
	// await (Promise) for program to finish executing
	// make sure we hit a `Program` first thing
	return new Promise(function (resolve, reject) {
		// onInstruction awaits until stack is cleared
		// convert infix to postfix, in order to simplify processing
		if(!runContext.programTimer) {
			runContext.programTimer = setInterval(
				// onInstruction is called once, begins
				//   stack frame initialization unto onEval
				//   can be called with a final result and
				//   frame returns to (frame - 1)
				// bind to self for timed execution ?
				onEval.bind(null, runContext, resolve, reject), 1000/60)
		}
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
		// TODO: return a new call frame
		runContext.programCallstack.push(void 0)
		runContext.frameId = runContext.programCallstack.length
		if(runContext.program.body.hasOwnProperty('length')) {
			runContext.programCallstack.push(runContext.program.body[0])
		} else {
			runContext.programCallstack.push(runContext.program.body)
		}
		return onEval(runContext, resolve, reject) // do one frame synchronously
	})
}

// TODO: get rid of repl/accessor
// TODO: NEED A WAY TO SET EXPECTATIONS BETWEEN REMOTE SERVICES
//   IF I DO THIS ON A LANGUAGE LEVEL, LIKE MEMBER EXPRESSION -> CALL EXPRESSION
//   MAYBE I WILL NEVER HAVE TO DEAL WITH MISSING DATA AGAIN AT A HIGHER LEVEL
//   IT IS JUST ASSUMED BY MY BASIC TYPES (I.E. VOID 0) VOIDZERO Good name for project?
/*


if(!evalStr) {
	throw new Error('No program!')
}
if(typeof evalStr != 'string') {
	throw new Error('Don\'t know what to do!')
}

*/
// INTERESTING IT APPEARS TO BE CONTINUING ON ERROR, 
//   I SHOULD PRESERVE THAT FUNCTIONALITY AS A FEATURE
// TODO: move to before symbol

function onEval(runContext, resolve, reject) {
	// Step by step calculator? this a basic stack based
	//   calculator, except parentheses operators has already
	//   been simplified for us via the walk.full()
	// If we load the full stack infix-posfix the 
	//   programCallstack is actually just a list with 
	//   a new mirror of doInstruction push operations, 
	//   makes it easy to isolate single call-frames 
	//   when debugging.

	// TODO: collect comments here instead of parser? where are they?
	// https://github.com/acornjs/acorn/issues/753#issuecomment-437232927
	//   higher level language? software nuero-lingistic 
	//   programming?
	// off the program stack, on to call stack, 
	//   same as in CPU memory, but at the...
	let abstractNode = runContext.programCallstack.pop()
	if(abstractNode && abstractNode.type == 'Evaluate') {
		// prevent recursion
		return Promise.resolve(node.value())
	}

	if(runContext.programCallstack.length > runContext.frameId) {
		runContext.error = new Error('Callstack corrupted!')
		throw runContext.error
	} else
	if (runContext.programCallstack.length < runContext.frameId
			|| runContext.error) {
		clearInterval(runContext.programTimer)
		if(runContext.error) {
			console.log('Program error: ', runContext.error)
			return reject(runContext.error)
		} else {
			runContext.error = new Error('Program error.')
			throw runContext.error
		}
	} else if (typeof abstractNode == 'undefined') {
		return resolve(runContext.bubbleReturn.pop())
	}

	// onInstruction pushes AST arguments/left/right 
	//   onto stack synchronously as a result of every 
	//   async eval or the natural await stack.pop() 
	//   at specified FPS. It's a program animator.
	//function onInstruction(abstractNode) {
	// TODO: check for `@NodeAttributes` ?
	//  @Program, do pushes in order of predicates.
	//    implied predicated pushed first to be evaled 
	//    last. add parallelism options this time with
	//    Array.filter() and _Promise replacement as a
	//    part of REPL middleware. evaluator should 
	//    be able to support it this time around.
	// queues up new instructions or pushes onto return stack
	runContext.programCallstack.push({
		type: 'Evaluate',
		value: doAttribute.bind(null, runContext, abstractNode)
	})
	return onEval(runContext, resolve, reject)
		// Format: @Program(__name, __callback)
	// convert entire eval repl to a single program stack
	//   this might help with debugging because then it is flat
	//   no branching to await calls
	// TODO: NEED A WAY TO SET EXPECTATIONS BETWEEN REMOTE SERVICES
	//   IF I DO THIS ON A LANGUAGE LEVEL, LIKE MEMBER EXPRESSION -> CALL EXPRESSION
	//   MAYBE I WILL NEVER HAVE TO DEAL WITH MISSING DATA AGAIN AT A HIGHER LEVEL
	//   IT IS JUST ASSUMED BY MY BASIC TYPES (I.E. VOID 0) VOIDZERO Good name for project?
	// pass to infix to postfix stack creator
	//return acorn.walk.simple(abstractNode, onInstruction
	//		.bind(null, runContext.programCallstack))
	//}
	
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

