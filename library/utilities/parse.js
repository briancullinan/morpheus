/*


Papa-parse is the only javascript based CSV parser
that I could find to properly parse commas inside of
string "" quotes. It also properly parses commas inside
of excaped strings inside of strings like """",""""
is a common inside a quoted string like paraphrasing someone.

It can also replace commas for tabs and properly parse
tabs inside of strings inbetween commas, etc.
All the other parsers I tested failed miserably in 
a fairly obvious edge case, like they weren't even 
trying to solve edge-cases but released it as a library
anyways. 

For this love and passion I should write a utility 
just about parsing.

There was a cool tool that came out a few years ago,
used for web scraping but there was a GUI built around
transformations, you could attach to any page with a
key and grab data/links/downloads/names off of a page
using either point and click or some coded paths.

It was essentially the visual designer to getAllXPath({})
utility I wrote that automatically rips series of data
and returns it in the same format as the requested.
i.e. ['//XPath', transform() => {}] returns a list
and {title: '//XPath'} returns an object with title set to the result

Some kind of automated pattern finder for HTML elements
Obviously, something to pass that into patterns.js for
removal, so if someone copies HTML out of the view-source
directly or if we copy a big HTML tree structure to
look up, patterns.js should be able to "flatten" it
and we'll need to visually verify the CSS can be flattened too.
Something like:
// @Template(wrapperQuine)
({
params: Object.keys(nodes).join(', '),
body: (code).toString()
})

Where every branch of the HTML tree is flattened, and
on each flatten action it coallesce the children nodes
and as it's unwinding with the children moved up to 
parent.parentElement, wkhtml2pdf is running every frame
taking screenshots after the move and joining of CSS.

If images are too different from each other, the something
can probably be skipped. This should help visually verify
complexity inside of HTML pages like Google's webmaster
tools do, it should be able to remove unnecessary cascading,
and as a side-effect, help identify the structural patterns 
in the page. i.e. the page looks different but is similarly
different in 6 different place (edge detection), we much have 
hit a list structure.

CODE REVIEW interesting using a combination of simpler
algorithms to solve a problem instead of jumping directly
to linear-regression, monte carlo, and cloud-based quantum-annealing.

*/

// Try to capture the whole line in between syntax
const FUNCNAME = '([a-z]+[a-z-_]*)'
const WORDINESS = '[\\s\\S]*?\\w[\\s\\S]*?'
// TODO: parse our own file and return;
//   a true quine parser, everything we need to
//   that the template and attribute systems.
const INITOBJ = /\n\(\{\n[\s\S]*?\n\}\)\n/g

// exit before hitting weird object code
if(typeof module != 'undefined') {
	let parser = readFile(__filename).toString('utf-8')
	let code = parser.replace(INITOBJ, '')
	 // parse our own object inits
	let globalObjects = []
	while((init = INITOBJ.exec(parser))) {
		globalObjects.push(init[0])
	}
	let context = globalObjects[0]
	let wrapperQuine = eval(template(
		'(' + (function (wrap) {
			return template(context, body) 
		}).toString() + ')', {
			body: context.trim(),
			wrap: 'context, nodes, code',
		}))
	let parseCode = eval(globalObjects[1])
	console.log(wrapperQuine.toString())
	console.log('\n\n\n\n')
	console.log(wrapperQuine(wrap, parseCode, globalObjects[2]))
	//console.log(parseCode)
	//let nodes = eval(globalObjects[1])
	//let parserCode = template('(' 
	//		+ wrap.toString() + ')()', nodes)
	console.log(parserCode)
	let parseNode = function () {
		console.log(parserCode)
	}

	let result = eval(parserCode)
	console.log(result(void 0, code).toString())

	// TODO: load accumulate and template.js
	// TODO: parse our own weird file, and append this list
	let myModule = {
		parseCode,
		// wrapTemplate: wrap,
		// conditionTemplate etc object, accumulate
	}
	
console.log()


	module.exports = myModule
	return module.exports
}


// TODO: balanced doesn't work on regexp?
// that makes it repeatable
// CODE REVIEW, interesting, if I make a regexp parser
//   for this file format only, I'm actually implementing
//   the rules I outlined already like, 1 or 2 functions
//   per file, files match another, greater template.
// by checking for maximum number of {} versus  { {  } }
//   I'm implementing my rule for complexity and also
//   fixing my need to include "balanced" because the
//   maximum level of possible contexts is finite.
// try to match a pattern to the object value for 
//   classification.


// TODO: this probably has to be unit tested
// TODO: move to parse.js and parse out ({}) and try for /** */
// @Init
// TODO: do using regex and plain text,
// simple attribute system for bootstrapping?

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

// BASIC TEMPLATE SYSTEM, find and replace tokens
// @Quine
// @Add(@Template,template) automatically create templates out of anything marked with @Template
function template(string, object) {
	let params = Object.keys(object)
	let values = Object.values(object)
	for(let i = 0; i < params.length; i++) {
		string = (string + '').replace(
				new RegExp(params[i], 'g'), values[i])
	}
	return string
}

// TODO: replace parse context when REPL loads.
//   i.e. parse(node) override
// this is so parse will load without error
// CODE REVIEW, don't need `g` because 1 per line?
// @Nodes
({
attributes: (/@(\w*)\s*\(*\s*([^,\)\s]*)\s*(,\s*[^,\)\s]*\s*)*\)*/i),
functiondeclaration: new RegExp(`function\\s+${FUNCNAME}[\\s\\n\\r]*\\(`),
comments: /(^|\s+)\/\/(.*)$/,
// does this work on other's code?
objectexpression: new RegExp(`\\(\\{\\n(${WORDINESS}\\s*:\\s*${WORDINESS})+\\n\\}\\)`),
logicalexpression: new RegExp(`\\(${WORDINESS}(&&|\\|\\|)${WORDINESS}\\)`),
variabledeclaration: new RegExp(`(^|\\n|\\s+)(let|var|const)${WORDINESS}(\\n|;)`),
// TODO: unary
booleanexpression: new RegExp(`\\(${WORDINESS}(==|!=|>|<|>=|<=|===|!==)${WORDINESS}\\)`),
// TODO: identifier
identifier: new RegExp(`((['"])${WORDINESS}\\2)`),
assignmentexpression: new RegExp(`(${WORDINESS})\\s=\\s(${WORDINESS})`),
})

// all the quake 3 parse code looks the same
// Which is actually a template of @Accumulate with
//   `for`s and a different condition?

// THEORY IF I CAN PARSE THIS IN LESS THAN 30 LINES
//   OF CODE, THEN I WILL HAVE A WORKING PARSER CAPABLE
//   OF PARSING ALL OF THE TEMPLATES OUT OF THIS FILE
//   WHICH MEANS IT CAN PARSE ALL THE TEMPLATES IN THE
//   LIBRARY AND APPLY ATTRIBUTES ACCORDINGLY, NEED
//   TO END UP WITH CALL TO EMITCLI()
// DEPENDENCY FREE, I.E. JS ONLY TO LOAD, NO ACORN.
//   THAT WAY ACORN CAN BE A PLUGIN TO THE SYSTEM LIKE
//   ANTLR.

// Parse(nodes)
// @Loop(for) - everything else is implied
({
lines: code.toString('utf-8').split(','),
body: lines.forEach(parseNodes), // CODE REVIEW, interesting, refering back to itself for context?
})

// @Loop(for)
({
// TODO: there is a way to decouple this from 
//   nodejs Object, but that seems a little extreme
values: Object.values(nodes),
keys: Object.keys(nodes),
body: keys.forEach(parseNodes),
})

// @Loop(reduce)
// @Condition
({
result: (result[keys[j]][i] = values[j].exec(lines[i])) // side-effect null
})


// ############### MESSING AROUND WITH POSSIBLE PARSER ABILITIES.


// a basic @File template looks like 
// @Template
({
ignores: attributes[i] 
	&& (attributes[i][1].toLocaleLowerCase() == 'ignore'
	|| attributes[i][1].toLocaleLowerCase() == 'template'),
templates: typeof functiondeclaration[i] != 'undefined',
declarations: typeof objectexpression[i] != 'undefined',
})


function object({params: {init, init2}}) {
return ({
property: init,
property2: init2,
})
}

// TODO: totally messing this up, need to check 
//   attributes[] near functions[i] and replace 
//   those in code with globalAttributes calls
//   using the accumulate() template.


// @Accumulate(attributes)
({
shouldStore: functions[i],
shouldDiscard: !lines[i],
// throw away attributes if empty lines are hit
// must be list right above functions or objects
list: attributes,
store: transform(attributes[i])
// store it back in the list but at the position of the function
// TODO: possible side effect /* @Attrib */ function on the same line
})


function transform(attribute) {
	return attribute.split(',')
	.map(function (p) { return p.trim() })
	.slice(1)
}


// @Template
function loop(context) {
	// @Iterator
	{
		// @Body
	}
	// @Suffix
}


// hmm, if I replace these with template strings and somehow parse
//  expectations I can possibly turn this into something like
// @Loop
({
	// where the keys of condition are automatically expended from the object
loops: ['for', void 0, 'while', void 0, 'do', 'while'],
// at least one has to be supplied?
conditions: [
	['init', 'test', 'update'], void 0,
	['test'], void 0, // branches
	void 0, ['test'],
],
// ^^^ then that kind of stuff I can map directly to ANTLR
//   for generalization
})


// TODO: now that I have all by syntax types I can put them
//   into arrays with the same names then continue checking
//   with the parser.

// in order to parse our own code files
//   we need a few quines 
// @Template
function condition() {
	if(test1) {
		ifThen
	} else 
	if (test2) {
		elseIf
	} else {
		Else
	}
}


// To import functions from other places and create 
//   `module` the Module wraps the new module in a 
//   function that gives the code path and filename 
//   context.
// @Template
function wrap() {
	return (function (params) {
		body
	})
}


// TODO: i.e. comments, markdown, attributes (circular)
// @Add(@Accumulate,accumulate) -- implied by line below?
// @Template(accumulate)
// @Loop(for)
// @Body
({
test1: shouldStore,
ifThen: store = list.splice(0),
test2: shouldDiscard,
elseIf: list.splice(0),
Else: list.push(item)
})

