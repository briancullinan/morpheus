
// this is some nice distilling
// BASIC TEMPLATE SYSTEM, find and replace tokens
// Source: https://stackoverflow.com/questions/29182244/convert-a-string-to-a-template-string
String.prototype.interpolate = function interpolateTemplate(params) {
	const names = Object.keys(params);
	const vals = Object.values(params);
	return new Function(...names, `return \`${this}\`;`)(...vals);
}


// BASIC TEMPLATE SYSTEM, find and replace tokens
// @Quine
// @Add(@Template,template) automatically create templates out of anything marked with @Template
function template(string, object) {
	let params = Object.keys(object)
	let values = Object.values(object)
	for(let i = 0; i < params.length; i++) {
		string =
		(string + '').replace(
				new RegExp(params[i], 'g'), values[i])
	}
	return string
}


// this should allow me to make code like this
// TODO: wind this whole template naming into caching 
//   system to easily lookup template names with @Cache

// CODE REVIEW, comment possible side-effects ahead of time as a part of design.
// TODO: side-effect, check matching object key names in a function or call
//   a different function with matches, this is a @Template thing to do?


// ATTRIBUTE SYSTEM
// a node template looks like this
// @Template
// @Add(@Function,template)
// @Attribute
function attribute(
	/* @Cache */ list, 
	name, node, params
) {
	if(name == '@Function') {
		attributes[name].push(eval.bind(null, node))
	} else 
	if (name == '@Attribute') {
		list.push(node.bind(null, params))
	} else 
	if (name == '@Object') {
		// @Cache
		params[0](list[i], node)
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

({


})

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

