// something is wrong with repl
//   it's way too slow
//   let's try something new

let programThreads = []
let programResponses = []
let programHeap = []

const BOOTSTRAP_CURSOR = 'script'
const BOOTSTRAP_EVAL = `(
// 
// @Add(@FunctionExpression,doBootstrap)
function () {
	${BOOTSTRAP_CURSOR}
})()`
const PREAMBLE_LINES = BOOTSTRAP_EVAL
		.split(BOOTSTRAP_CURSOR)[0]
		.split('\n').length

// pretty loose attribute parser, parses attribs with 1 or more params
//  like @Function(_bootstrap,doBootstrap)

const MATCH_ATTRIBUTE = /@(add|remove)\s*\(\s*([^,\)]*?)\s*(,\s*[^,\)]*?\s*)*\)/i

// every time I feel like I can make a vast improvement in style
// to test this concept, lets use it from the very beginning
function doEval(runContext) {
	let accumulatedComments = []
	if(!runContext.body) {
		return Promise.resolve(acorn.parse(
			BOOTSTRAP_EVAL.replace('script', runContext.script),
			{	
				ecmaVersion: 2020, locations: true, 
				onToken: function (abstractNode) {
					if(typeof runContext.comments == 'undefined') {
						runContext.comments = []
					}
					runContext.comments[abstractNode.start] = accumulatedComments
					accumulatedComments = []
				},
				onComment: function (_, comment, start, end) {
					accumulatedComments.push(comment)
					// add aspects to control program stack
				}
			// make sure we hit a `FunctionExpresion` first thing
			}).body[0].expression.callee)
			.then(doStatments.bind(null, runContext))
	} else {
		return Promise.resolve(doStatments.bind(null, runContext))
	}
}

function doStatments(runContext, program) {
	return new Promise(function (resolve, reject) {
		programThreads.push(runContext)
		programResponses.push({resolve, reject})
		if(typeof runContext.bubbleReturn == 'undefined') {
			runContext.bubbleReturn = new Array(programThreads.length).fill(void 0)
		} else {
			runContext.bubbleReturn.push(void 0)
			console.assert(runContext.bubbleReturn.length == programThreads.length)
		}
		if(typeof runContext.attributes == 'undefined') {
			runContext.attributes = {
				'add': [
					doAdd
				],
				'remove': [
					doRemove
				],
				'@evaluate': [
					onEval
				]
			}
		}
		runContext.doBootstrap = doBootstrap
		runContext.programTimer = setInterval((
		function ({programCallstack, callFrame, runContext}) {
			if(doBubbleOut(programCallstack, callFrame, runContext)) {
				programThreads.splice(programThreads.indexOf(runContext), 1)
				if(typeof runContext.error != 'undefined') {
					return reject(runContext.error)
				} else {
					return resolve(runContext.bubbleReturn.pop())
				}
			} else {
				doAttributes(programCallstack.pop(), 
						{programCallstack, callFrame, runContext})
			}
		}).bind(null, {
			programCallstack: program.hasOwnProperty('length') ? program : [program],
			callFrame: programThreads.length,
			runContext: runContext,
		}), 1000/60)
	})
}

function doBubbleOut(stack, frame, runContext) {
	if(stack.length < frame - 1) {
		throw new Error('Program error: ', runContext.error)
	} else // if (stack.length)
	return stack.length < frame
}

function doAttributes(abstractNode, {programCallstack, callFrame, runContext}) {
	let comments = runContext.comments[abstractNode.start] || []
	if(typeof comments == 'string') {
		comments = [runContext.comments[abstractNode.start]]
	}
	for(let i = 0; i <= comments.length; i++) {
		let attribName
		let params = []
		if(i == comments.length) {
			attribName = '@'+abstractNode.type.toLocaleLowerCase()
		} /* else if (i == comments.length + 1) {
			attribName = 
		} */ else {
			let match = MATCH_ATTRIBUTE.exec(runContext.comments[abstractNode.start])
			if(match) {
				attribName = match[1].toLocaleLowerCase()
				params = match[3].split(/\s*,\s*/g).slice(1)
				params.unshift(match[2])
			} else {
				continue
			}
		}
		if(typeof runContext.attributes[attribName] == 'undefined') {
			continue
		}
		for(let j = 0; j < runContext.attributes[attribName].length; j++) {
			let callee = runContext.attributes[attribName][j]
			if(typeof callee == 'string') {
				callee = runContext[runContext.attributes[attribName][j]]
			}
			callee(params, {abstractNode, programCallstack, callFrame, runContext})
		}
	}
	
}

function doAdd(attributeParams, {abstractNode, runContext}) {
	if(typeof runContext.alreadyAttributed == 'undefined') {
		runContext.alreadyAttributed = []
	}
	if(runContext.alreadyAttributed[abstractNode.start]) {
		return
	}
	runContext.alreadyAttributed[abstractNode.start] = true
	if(typeof runContext.attributes[attributeParams[0].toLocaleLowerCase()] == 'undefined') {
		runContext.attributes[attributeParams[0].toLocaleLowerCase()] = []
	}
	runContext.attributes[attributeParams[0].toLocaleLowerCase()].push(attributeParams[1])
}

function doRemove(attributeParams, {runContext}) {
	if(typeof runContext.attributes[attributeParams[0].toLocaleLowerCase()] == 'undefined') {
		delete runContext.attributes[attributeParams[0].toLocaleLowerCase()]
	}
}

const PROGRAM_EXPRESSIONS = [
	'Program', 'Unsyntactic', 'BreakStatement', 'ContinueStatement',
	'DebuggerStatement', 'DoWhileStatement', 'VariableDeclaration', 'IfStatement',
	'ReturnStatement', 'SwitchCase', 'SwitchCase', 'SwitchStatement',
	'ThrowStatement', 'CatchClause', 'TryStatement', 'VariableDeclaration',
	'WhileStatement', 'WithStatement', 'EmptyStatement', 'LabeledStatement',
	'ExpressionStatement', 'BlockStatement', 'ForStatement', 'ForInStatement',
	'ForOfStatement', 'VariableDeclarator', 'FunctionDeclaration', 'FunctionExpression',
	'ClassBody', 'ClassDeclaration', 'ClassExpression', 'Identifier',
	'MethodDefinition', 'PropertyDefinition', 'StaticBlock', 'ExportAllDeclaration',
	'ExportDefaultDeclaration', 'ExportNamedDeclaration', 'ExportSpecifier', 'ImportDeclaration',
	'ImportDefaultSpecifier', 'ImportNamespaceSpecifier', 'ImportSpecifier', 'SpreadElement',
	'RestElement', 'ArrayPattern', 'AssignmentPattern', 'SequenceExpression',
	'AssignmentExpression', 'ConditionalExpression', 'LogicalExpression', 'BinaryExpression',
	'UpdateExpression', 'UnaryExpression', 'UpdateExpression', 'ChainExpression',
	'MemberExpression', 'CallExpression', 'TaggedTemplateExpression', 'Super',
	'ThisExpression', 'Literal', 'ArrayExpression', 'ImportExpression',
	'MetaProperty', 'Literal', 'SequenceExpression', 'ParenthesizedExpression',
	'MetaProperty', 'NewExpression', 'TemplateElement', 'TemplateLiteral',
	'ObjectPattern', 'ObjectExpression', 'RestElement', 'SpreadElement',
	'Property', 'FunctionExpression', 'ArrowFunctionExpression', 'Identifier',
	'PrivateIdentifier', 'YieldExpression', 'AwaitExpression',
]

function doBootstrap(attributeParams, {runContext}) {
	if(runContext.doneBootstrap) {
		return
	}
	runContext.doneBootstrap = true
	for(let i = 0; i < PROGRAM_EXPRESSIONS.length; i++) {
		let newAttribName = '@' + PROGRAM_EXPRESSIONS[i].toLocaleLowerCase()
		if(typeof runContext.attributes[newAttribName] == 'undefined') {
			runContext.attributes[newAttribName] = []
		}
	
		if(typeof runContext['do' + PROGRAM_EXPRESSIONS[i]] == 'function') {
			runContext.attributes[newAttribName].push(
				runContext['do' + PROGRAM_EXPRESSIONS[i]]
			)
		} else {
			runContext.attributes[newAttribName].push(
				doInstruction
			)
		}
	}
}

function onEval(attributeParams, 
	{abstractNode, programCallstack, runContext}) {
	debugger
	console.log('Thread ' + runContext.programTimer, 'Evaluate.' + node.type)
	//console.log(...exp)
}

function doInstruction(attributeParams, 
		{abstractNode, programCallstack, runContext}
) {
	// TODO: if type == Evaluate, await
	debugger
	programCallstack.push({
		type: 'Evaluate',
		value: (function (instruction) {
			onEval(runContext, instruction)
			debugger
			throw new Error(abstractNode.type + ': Not implemented!')
		}).bind(null, abstractNode)
	})
	//
}

//function doFunctionExpression(attributeArg, attributeParams, abstractNode, runContext) {
//	debugger
//}
