// NAME OF ATTRIBUTE SYSTEM: PASTA

// OKAY THEORY
//   A CPU INTERRUPT ADDS 1 VARIABLE
//   1 VARIABLE MAKES 2 BY COUNTING
//   A POSITION IN MEMORY INSTEAD OF
//   COUNTING ONLY A NUMBER.
//   2 VARIABLES MAKES INIFINITE VARIABLES
//   BY COUNTING ANOTHER MEMORY POSITION
//   USING THE FIRST MEMORY POSITION.

// MORE THEORY.
//   UNLIMITED MEMORY POSITIONS LOADS A
//   SINGLE PROGRAM STARTING POINT INTO
//   A LIST. FUNCTIONS ADD 1 LEVEL OF COMPLEXITY.
//   FUNCTION CALLS CREATE MINIATURE STACKS OF 
//   PROGRAMS, HENCEFORTH, THE SHELL.
//   THANKS TO ADA, WE HAVE OBJECT ORIENTED PROGRAMMING.
//   OBJECTS ADD 1 MORE LEVEL OF COMPLEXITY TO SOFTWARE
//   BY GROUPING FUNCTIONS TOGETHER LOGICALLY.

// STILL THEORY...
//   CPUs ARE COMPLEX. SOFTWARE IS COMPLEX.
//   CLASSES / COMPONENTS / MODULES / NAMESPACES / DEPENDENCY INJECTION
//   ALL ADD A HEIRARCHY OF COMPLEXITY TO PROGRAMS.
//   ENTER, PRE-COMPILER #IFs. SO GREAT, BUT DECLARATIVE
//   UNLESS USING SPECIAL EXTENSIONS. THE FACT THAT
//   PRE-COMPILER STATEMENTS ARE DECLARATIVE RATHER
//   THAN IMPERATIVE IS WHAT MAKES THEM SIMPLE ENOUGH
//   TO PUT IN BETWEEN CODE AND UNDERSTAND.
//   #IF DEFINED  // COMMENT ON WHY
//      ... DO SYSTEM CODE 
//   #ELSE 
//      ... DO OTHER CODE
//   #ENDIF
//
//   THIS LOOKS GREAT.

// THIS ADDS A NICE LITTLE ABILITY TO ADD ENVIRONMENTAL
//   CONTEXTUAL EXCEPTIONS IN CODE SUPPLEMENTED BY COMMENTS.
//   THE ONLY THING HOLDING THIS CONCEPT BACK IS ASPECTS.
// ASPECTS ARE LIKE COMPILER STATEMENTS THAT RUN AT
//   COMPILE TIME OR RUNTIME AND INSTEAD OF BEING ONLY
//   DECLARATIVE, THEY ARE ALSO FUNCTIONAL.
// HERE'S REALLY THE KEY POINT ON ASPECT ORIENTED PROGRAMMING
//   THE LEVEL OF COMPLEXITY THAT ASPECTS / ATTRIBUTES ADD
//   ARE DECLARATIVE BECAUSE IT IS A LANGUAGE STATEMENT/FEATURE.
//   INSTEAD OF COMPONENTS, CLASSES, AND DEPENDENCY INJECTION,
//   THOSE ARE ALL FUNCTIONAL COMPLEXITIES ADDED AT THE "SOFTWARE"
//   LEVEL AS OPPOSED TO "LANGUAGE" LEVEL. 
// THEY ARE OVERLY COMPLEX BECAUSE PEOPLE TURN "COMPONENTS"
//   INTO IMPLEMENTATION DETAILS. BUT BY USING ATTRIBUTES/ASPECTS
//   THAT SAME COMPLEXITY IS TURNED INTO A DECLARATIVE LANGUAGE
//   FEATURE, SO IT NEVER CHANGES BEHAVIOR. THE FACT THAT IT
//   NEVER CHANGES BEHAVIOR MAKES IT FINITE, WHICH MAKES IT
//   PROVABLE, WHICH MEANS YOU DON'T NEED TO WRITE UNIT-TESTS
//   FOR USING @ATTRIBUTES. FUCK UNIT-TESTS. THAT'S WHAT THIS
//   IS ALL ABOUT. NOT WRITING UNIT-TESTS.
// THERE WILL BE NOTHING LEFT TO TEST BECAUSE EVERY PROGRAM
//   WILL BE ONLY STATEMENTS AND IDEAS WITH NO FUNCTIONS OR
//   FRAMEWORKS OR ENVIRONMENTS.

// how the hell do I use attributes on the file that specifies how attributes work?
//   this is like taking the integral of logic and then testing it's limits.
// Obviously: 

// @Template
async function evaluate(topOfStack) {
	await topOfStack()
}

// but this is too simple, one more level of complexity and I 
//   should specify all the outputs of my attribute evaluations

// do attribute events, do @Before events
// @Add(@Node,doAttributes)
// on response events, do @After calls
// @Add(@Node,doNode)
`node`

// ^^^ Need to connect those two things together in 
//   one function using template system.

// pretty loose attribute parser, parses attribs with 1 or more params
//  like @Function(myCustomBootstrap,doBootstrap)
const MATCH_ATTRIBUTE = /@(\w)\s*\(\s*([^,\)]*?)\s*(,\s*[^,\)]*?\s*)*\)/i

({
	// TODO: match only the comments right before functions
	topOfStack: list(/\sfunction\s*[^\()]*?\(/g),
	// TODO: match all attributes in comments
	topOfStack: MATCH_ATTRIBUTE.exec(comment), // TODO: only one @attr per line comment
	// TODO: one more match to match any word with an @attr above it, to match objects
	//   variables, parameters, etc...

})

// So, one function to read all attribute either
//   by parse text or loading acorn?
// ENTRY INTO ATTRIBUTE SYSTEM
function doAttributes(runContext, abstractNode) {

	// CODE REVIEW, THIS IS A PRE-CURSOR TO LOADING
	//   THE CURRENT NODE'S ATTRIBUTES LOAD THE ACTUAL
	//   ATTRIBUTES FROM COMMENTS INTO THE NODE OBJECT
	if(typeof abstractNode.attributes != 'undefined') {
	}

	// this runs 1 time to load attributes for the 
	//   statement for the whole program
	//   i.e. if a function is called multiple times
	//   it does not load it's own attributes multiple 
	//   times, only once. if attributes need to change
	//   every time a function is called, an attribute
	//   should be created that changes the list of
	//   runContext.attributes. i.e. @Add(@Function, _changeAttribs)
	runContext.programCallstack.push({
		type: 'Evaluate',
		value: doNodeAttributes
				.bind(null, runContext, abstractNode,
						// for convenience
						runContext.comments[abstractNode.loc.start])
	})

	if(typeof runContext.attributes == 'undefined') {
		runContext.attributes = []
		// TODO: do
	}

	if(typeof abstractNode.attributes != 'undefined') {
		return // prevent recursion
	}

	abstractNode.attributes = []
	for(let i = 0; 
		i < comments.length; 
		++i) {
		let match = MATCH_ATTRIBUTE.exec(
				comments[abstractNode.loc.start][i])

		if(!match) { continue }
		let attribName = match[1].toLocaleLowerCase()
				.replace(/^@/, '')
		// TODO: load attributes from comments into nodes
		// on instructions
		// actually to do the attribute thing
		// TODO: @Node attribute also fires
		//   doAttribute within the predicate frame
		if(typeof runContext.attributes[attribName] == 'undefined') {
			runContext.attributes[attribName] = []
		}
		runContext.attributes[attribName].push([
			match[1], 
			[match[2]].concat(match[3].split(',')
				.map(function(attr) { return attr.trim() })),
			[comments[abstractNode.loc.start][i]]
				.concat(Array.from(match))
		])
	}

	// TODO: add C# static Class loader feature here

	// TODO: add / remove
	for(let j = 0;
		j < runContext.attributes[attribName].length;
		j++) {

		if( == 'add' || 'remove') {

			// push onto runContext.attributes
			continue
		}

		// push only abstractNode.attributes
	}

}

// TODO: make this a DFA animation showing every node type
//   in a long list and shifting between positions
//   should go nicely with the vertical line highlighter.

({


})

// I THINK THIS FULLY CAPTURES WHAT I WAS IMAGINING
/* 
this list above adds attributes via @add(@function,doFunction)
		to abstractNode.attributes only once it loads this list.
the loops below add call statements for attributes in the order of

using @function for example, but this runs the 
	same for every symbol, ie.e @literal @identifier @codeblock
@add(@function, doOnce) - means run on attribute load - one time
@add(function, doFunction) - means run on every function node - this one is implied

- one time only for each node type
		@add/@remove(@function, doCustomFunction) - runContext.attributes
		@dev/@myCustomAttribute - abstractNode.attributes
	push doFunctionAttribute  - first time only
	push all on to stack (@function -> doCustomFunction)  - one time only

- runs every time for a node
	push doNode - Evaluate
	push doFunction
	push all (abstractNode.attributes) i.e. @auth/@public
	push all (runContext.attributes['function']) - without @ 
																	means run on node, not run on attribute loading

THIS ENSURES PROGRAMMATIC CONTROL OVER EVERY STEP USING CALLBACKS
basically:
		@runFunction() callbacks - once
		doFunctionAttribute()
		
		runFunction callbacks - every node
		@user @attributes - all user defined attributes for node every call
		doFunction - load params / body

		doNode - start on* callback events

TODO: add @before, @after as POC

*/


// TODO: write in a way we can add attribution to other things like MP3s
// TODO: look up attribs in library to figure out
//   what REPL functions to call for symbols, i.e.
//   one modest size function to handle all loop
//   types, @for,@do,@dowhile all on the doLoop()
// TODO: lookup function in global
// TODO: lookup function in library
// TODO: weird, how to collapse and make @Identifier lookups
//   also use the same doLibraryLookup call here? is this
//   art abstract enough for everyone? lol
// TODO: only 1 time, convenience for loading more attributes

// CODE REVIEW, USING THESE LITTLE INTERNAL RECURSIVE LOOPS SHOULD SHOW
//   UP AS LEAVES IN A CODE REVIEW TOOL, BUT IT ALLOWS THE FUNCTION ABOVE
//   TO MAINTAIN ITS PURPOSE OF LOADING THE CURRENT NODES ATTRIBUTES ONTO STACK
//   DESPITE HAVING A PRE-CURSOR TO THAT; I.E. ACTUALLY LOADING THE ATTRIBUTES


// TODO: combine entire attribute feature into 2 functions just like doEval()


function doNode(runContext, abstractNode) {
	// TODO:  if abstractNode has attributes
	// TODO: make this implicit using the look below?
	// this would be a good place to put `static` loaders
	//   i.e. doFunctionAttribute() { attributes.push('static', loadLibraries) }
	// This runs every time the call is hit
	// CODE REVIEW, I DON'T LIKE USING `this.`, implement static "prototype" functions from C#
	// TODO: micro manage call stack / return stack, that's all
	// TODO: push Attributes to stack
	// do instruction
	// this runs every time the call is hit
	// this runs 1 time for each node in a program to load @After node functions
	// TODO: @After calls
	// TODO: micro manage call stack / return stack, that's all
	// TODO: push Attributes to stack

	for(let i = 0; 
		i < comments[abstractNode.loc.start].length; 
		++i) {
	let match = MATCH_ATTRIBUTE.exec(
			comments[abstractNode.loc.start][i])
}

// this would be a good place to put `static` loaders
//   i.e. on
if(typeof globalThis['on' + abstractNode.type + 'Attribute']) {
	programCallstack.push({
		type: 'Evaluate',
		value: globalThis['on' + abstractNode.type+ 'Attribute']
				.bind(null, runContext, abstractNode)
	})
}
}

// #################### BOTTOM_HALF

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


