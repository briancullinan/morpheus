// inject repl service with utilities attached into any webpage

// I'm not going to try and run all of ace inside my custom evaluator
// Runtime.evaluate is a real one, so that's a big sink
// Then obviously anything I can build or assemble as plain
// text for deployment will also have evaluate.
// These things can be dependency injected to run in a worker
// or backend/frontend plugin or even a hack to communicate 
// with browser caching for offline content.
// Lots of ways to run a process, abstraction makes it more reliable?

// what does a basic repl service look like?
// TODO: @REPL() // automatic type checker for `request`
async function repl(request, response) {
	try {
		let result = await execute(request)
		return response(result)
	} catch (e) {
		response(e)
	}
}


function execute() {
	// TODO: do an execute, start a timer that does a little dot
	//   for use in like browser or something
	//   wait for the response from the other end 
	//   but using the same endpoints here for both ends.
	//   client and server, check the runContext.threads
	//   and response with status message, try to pack all
	//   kernel communication into a single 50 LOC function.

}

// this is the part I was getting all mixed up with 
//   plugins/eval/accessors all because I couldn't think 
//   about the abstraction during so much planning.

// TODO: do everything else (i.e. onStatus()) using contextual attributes
// usually performed on "receiving" end
// this adds only 1 level on complexity to messages
//   it encodes responses as 
/*
return {
	type: 'number',
	number: 0,
}
*/
// TODO: make this even smaller, (prototype.constructor + '') ?
// @REPL() // automatic type checker for `response`
function encode(response) {
	// TODO: automatically with @REPL()
	/*
	if(response && typeof response.fail != 'undefined') {
		throw new Error('Member access error: ' + response.fail)
	} else

	if(response && typeof response.type != 'undefined') {
		return response[response.type]
	}
	*/
	if(response && typeof response == 'object') {
		return {
			fail: response.message,
			stack: response.stack.split(/\s*\n\s*/g),
		}
	}

	// convert response to compatible output
	let value = response
	let type = typeof value
	// TODO: move to rpc middleware? this is the new RPC middleware?
	if(type == 'function') {
		value = value + ''
	} else if (type == 'object') {
		value = JSON.stringify(Object.assign({
			_accessor: true
		}, value || {}))
	} else {
		value = JSON.stringify(value)
	}
	let result = {
		type: type,
	}
	result[type] = value
	return result

}

// TODO: this is still ugly
function doLibraryLookup(functionName) {
	/*
	let {
		readDir,
		readFile,
	} = 
	*/
	// TODO: tie into cache-system
	let libraryFiles = readDir(__library, true)
	for(let i = 0; i < libraryFiles.length; i++) {
		let libraryCode = readFile(libraryFiles[i])
		// make these tokens instead of function for cross language support
		return {
			type: 'File',
			name: libraryFiles[i],
			script: libraryCode,
			format: 'javascript',
			body: {
				type: 'Program',
				body: {

				}
			}
		}
	}
}


// add attributes to comments to JS for use in CI

// collects comments from parser?
function doComment(comments, accumulatedComments, token) {
	let commentLength = accumulatedComments.length
	comments[token.start] = accumulatedComments.splice(0)
	console.assert(comments[token.start].length == commentLength)
}

function onComment(accumulatedComments, _, comment) {
	accumulatedComments.push(comment)
}



// TODO: generalize this and put acorn.* inside an environment quine
function findFunctions(lib) {
	// TODO: get comments with attribute API?
	let comments = []
	let accumulatedComments = []
	let functionNames = []
	acorn.walk.full(acorn.parse.loose(lib, {	
		ecmaVersion: 2020, locations: true, 
		onToken: doComment.bind(null, 
				comments, accumulatedComments),
		onComment: onComment.bind(null, 
				accumulatedComments),
	}), {
		FunctionDeclaration(node) {
			debugger
			if(!node.name || !node.params || node.start < blockCount) {
				return
			}
			functionNames.push(node.name)
			for(let i = 0; i < node.params.length; i++) {

			}
		},
		BlockStatement(node) {
			debugger
			blockCount += node.end
		},
	})

}

/*



func beforeSymbol(AST, programCallstack, frame, runContext) {
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
		+ ', P-codes: ' + programCallstack
		.slice(AST.frameStart, AST.frameEnd)
		.map(func (symbol) {return symbol.type})
		.join(' . ')
		
		)
}

*/
