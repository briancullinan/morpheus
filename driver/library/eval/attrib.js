


// TODO: add attributes to comments to JS for use in CI

// collects comments from parser?
function doComment(comments, accumulatedComments, token) {
	let commentLength = accumulatedComments.length
	comments[token.start] = accumulatedComments.splice(0)
	console.assert(comments[token.start].length == commentLength)
}
function onComment(accumulatedComments, _, comment) {
	accumulatedComments.push(comment)
}

// pretty loose attribute parser, parses attribs with 1 or more params
//  like @Function(_bootstrap,doBootstrap)
const MATCH_ATTRIBUTE = /@(add|remove)\s*\(\s*([^,\)]*?)\s*(,\s*[^,\)]*?\s*)*\)/i


// TODO: write in a way we can add attribution to other things like MP3s
function doAttributes() {
	let comments = runContext.comments[abstractNode.start] || []
	if(typeof comments == 'string') {
		comments = [runContext.comments[abstractNode.start]]
	}
	for(let i = 0; i <= comments.length; i++) {
		let attribName
		let params = []
		if(i == comments.length) {
			attribName = '@'+abstractNode.type.toLocaleLowerCase()
		}
	}
	// TODO: push Attributes to stack
	// do instruction
}

function onAttributes() {
	// on instructions
	// actually to do the attribute thing
	// TODO: @Node attribute also fires
	//   doAttribute within the predicate frame
}

/*

if(!evalStr) {
	throw new Error('No program!')
}
if(evalStr.hasOwnProperty('length')) {
	return Promise.resolve(onInstruction(evalStr))
}
if(typeof evalStr != 'string') {
	throw new Error('Don\'t know what to do!')
}




function doComments(abstractNode) {
	let match = MATCH_ATTRIBUTE.exec(runContext.comments[abstractNode.start])
	if(match) {
		attribName = match[1].toLocaleLowerCase()
*/

//		params = match[3].split(/\s*,\s*/g).slice(1)

/*
		params.unshift(match[2])
	}
	comments[abstractNode.start] = accumulatedComments
	accumulatedComments = []
	for(let j = 0; j < runContext.attributes[attribName].length; j++) {
		let callee = runContext.attributes[attribName][j]
		if(typeof callee == 'string') {
			callee = runContext[runContext.attributes[attribName][j]]
		}
		// TODO: push onto stack using same mechanisms
		callee(params, {abstractNode, programCallstack, callFrame, runContext})
		// TODO: doAttributes
	}
}


function onComments(_, comment, start, end) {
	debugger
	accumulatedComments.push(comment)
	// TODO: doComments
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
				
			} else {
				
			}
		}).bind(null, {
			programCallstack: program.hasOwnProperty('length') ? program : [program],
			callFrame: programThreads.length,
			runContext: runContext,
		}), 1000/60)
	})
}


function doAttributes(abstractNode, {programCallstack, callFrame, runContext}) {
	 /* else if (i == comments.length + 1) {
			attribName = 
		}  {
			 else {
				continue
			}
		}
		if(typeof runContext.attributes[attribName] == 'undefined') {
			continue
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
	
	//
}

//function doFunctionExpression(attributeArg, attributeParams, abstractNode, runContext) {
//	debugger
//}


*/


