
// this is some nice distilling
// BASIC TEMPLATE SYSTEM, find and replace tokens
// Source: https://stackoverflow.com/questions/29182244/convert-a-string-to-a-template-string
function interpolate(template) {
	const names = Object.keys(params);
	const vals = Object.values(params);
	return new Function(...names, `return \`${this}\`;`)(...vals);
}
String.prototype.interpolate = interpolate


// this should allow me to make code like this
// TODO: wind this whole template naming into caching 
//   system to easily lookup template names with @Cache

// CODE REVIEW, comment possible side-effects ahead of time as a part of design.
// TODO: side-effect, check matching object key names in a function or call
//   a different function with matches, this is a @Template thing to do?

// TODO: balanced() finds balanced {} or ()

// ATTRIBUTE SYSTEM
// a node template looks like this
// @Template
// @Add(@Function,attribute)
function attribute(name, node, params) {
	if(name == '@Function') {
		attributes[name].push(template.bind(null, node))
	} else 
	if (name == '@Attribute') {
		globalTemplates.push(node.bind(null, params))
	} else 
	if (name == '@Object') {
		// @Cache
		params[0](globalTemplates[i], node)
	} else {
		throw new Error('Not implemented!')
	}
}

// TODO: call the above attribute system above once to make @Attribute events
// TODO: call attribute system above again to make onFunction events
// TODO: call it again to make doNode events
// ACORN DOES A COOL THING WITH FORMATTING PARAMETERS AND EXPANDING, COPY NAMING STYLE

// @Template(@Function)
({
Node: 'FunctionDeclaration',
Element: ''

})


// ATTRIBUTE SYSTEM TEMPLATE-PARSER WRITTEN IN ATTRIBUTE-SYSTEM FORMAT

// TODO: this could be delarative if I needed it for CallExpression below,
//   attribute() needs to imply this automatically though with template()
// @Template(attribute) ?? 
({
IfStatement: condition,
evaluate: function IfStatement(node) {
	// TODO: turn back into code template code, if needed
	if(condition) {
		return evaluate
	}
}
})
// TODO: ^^^ the rest of these like function() 
//   {for(transform all language sets) {body}} 
//      (i.e. ({select: evaluate(linq)}) is one eval.js REPL language 
//         declaration that wraps into a kernel.js template, 
//         those controllers are declarations inside /repl/)
//   should be found in their designated /repl/loops.js declarations file.
//   ({}) // do transforms on sets with declarations that feed functional / test
//   template functions. This is nice because I can come back later with our own
//   parser and check what features are missing using a declared list and a declarted
//   test.js function, that proves the test runner works too, 
//   and probably does istanbul more accurately / without bugs.

// adds an attribute declaratively, so I don't have to retest all attribute system branches every
//   time an attribute is added, I actually had to dive into C#.Net engine code to figure out
//   why my code was wrong inside a new attribute I wrote. That was painful, this is no more.
// @Template(attribute) 
({
CallExpression: node.name.match(/eval|doEval/i),
// TODO: LOL, cool, 1 line of code in attrib.js to feed
//  Object.keys[1] into base template before replacing 
//    this template with this line, once the system is 
//    started I'd never need @IfStatement, it would be
//    implied by other templates using `if` directly.
//    this is just a test/proof of concept for simplicity's
//    sake. This component is completed. < 30 LOC, 2 functions, 
//    2 declarations, mostly reading like a book.
// TODO: @IfStatement
evaluate: require('balanced').eval
})


// TODO: combine above 2 statements into 1 and replace @Template\nattribute()

({


})

// TODO: make a proof of concept mustache-style template in 3 
//   lines of code by evaluating code inside of {{{ blocks }}}
// TODO: make it independent of eval() or acorn([Program])
//   thanks to context abstraction. which means {{{ mustache }}}
//   code can be made from any language!
({


})


// create attributes automatically based on function names
// callback from the @Template attribute means, automatically
//   create a template out of this function, i.e.
//   calling template(cache) automatically searches all of
//   the bound functions for the function name
// TODO: lookup filter
// @Cache templateNames cache winding saves all our template names to a list
// TODO: replace all code-block in eval.js branches with declarative
//   statements to use with a replacement quine for instanbul and unit generator

// TODO: REPL TEMPLATE PROCESSOR.
// TODO: LATEX EVALUATOR.

