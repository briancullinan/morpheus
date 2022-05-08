


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

const TOP_HALF = [
	doNode,
	onAttributes,
	doNodeAttribute,
]


// TODO: write in a way we can add attribution to other things like MP3s
function doAttribute(
		programCallstack, comments, abstractNode) {

	for(let i = 0; i < TOP_HALF.length; i++) {
		programCallstack.push({
			type: 'Evaluate',
			value: TOP_HALF[i]
		})
	}

}


function doNode(runContext, abstractNode) {
	// TODO:  if abstractNode has attributes

	programCallstack.push({
		type: 'Evaluate',
		value: onNode
				.bind(null, runContext, abstractNode)
	})

	if(typeof globalThis['do' + abstractNode.type]) {
		programCallstack.push({
			type: 'Evaluate',
			value: globalThis['do' + abstractNode.type]
					.bind(null, runContext, abstractNode)
		})
	}

}


function onAttributes() {

	for(let i = 0; i < abstractNode.attributes.length; i++) {
		// TODO: add attributes to statements
		programCallstack.push({
			type: 'Evaluate',
			value: doNode
					.bind(null, runContext, abstractNode)
		})
	}

}


function doNodeAttribute() {
	// TODO: micro manage call stack / return stack, that's all
	// TODO: push Attributes to stack
	// do instruction
	for(let i = 0; 
			i < comments[abstractNode.loc.start].length; 
			++i) {
		let match = MATCH_ATTRIBUTE.exec(
				comments[abstractNode.loc.start][i])
		// TODO: load attributes from comments into nodes
		// on instructions
		// actually to do the attribute thing
		// TODO: @Node attribute also fires
		//   doAttribute within the predicate frame
		for(let i = 0; i <= comments.length; i++) {
			let attribName
			let params = []
			if(i == comments.length) {
				attribName = '@'+abstractNode.type.toLocaleLowerCase()
			}
		}
	}

}





// #################### BOTTOM_HALF


const BOTTOM_HALF = [
	onNodeAttribute,
	doAttributes,
	onNode
]

function onNode(runContext, abstractNode) {
	// TODO: add BOTTOM_HALF
	for(let i = 0; i < BOTTOM_HALF.length; i++) {
		programCallstack.push({
			type: 'Evaluate',
			value: BOTTOM_HALF[i]
		})
	}

	if(typeof globalThis['on' + abstractNode.type]) {
		programCallstack.push({
			type: 'Evaluate',
			value: globalThis['on' + abstractNode.type]
					.bind(null, runContext, abstractNode)
		})
	}

}

function doAttributes() {
	debugger

	if(typeof doStatus != 'undefined') {
		programCallstack.push({
			type: 'Evaluate',
			value: doStatus
					.bind(null, runContext, abstractNode)
		})
	}

	/*
	programCallstack.push({
		type: 'Evaluate',
		value: onNodeAttribute
				.bind(null, runContext, abstractNode)
	})

	programCallstack.push({
		type: 'Evaluate',
		value: globalThis['on' + abstractNode.type]
				.bind(null, runContext, abstractNode)
	})
	*/

}




// TODO: @After calls
function onNodeAttribute() {
	// TODO: micro manage call stack / return stack, that's all
	// TODO: push Attributes to stack
	// do instruction
	for(let i = 0; 
			i < comments[abstractNode.loc.start].length; 
			++i) {
		let match = MATCH_ATTRIBUTE.exec(
				comments[abstractNode.loc.start][i])
		programCallstack.push({
			type: 'Evaluate',
			value: doNode
					.bind(null, runContext, abstractNode)
		})
	}

}

/*

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

*/


