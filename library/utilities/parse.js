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
({
flatten: htmlTree(),
coallesce: wkhtml2pdfVerify(tree, css)
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
to linear-regression, monte carlo, and cloud-based annealing.

*/

const INITOBJ = /\n\(\{\n[\s\S]*?\n\}\)\n/g
// exit before hitting weird object code
if(typeof module != 'undefined') {
	// TODO: parse our own weird file, and append this list
	let myModule = {
		parseCode: parse,
		wrapTemplate: wrap,
		// conditionTemplate etc object, accumulate
	}
	let parser = readFile(__filename).toString('utf-8')
	let init
	 // parse only our object inits
	while((init = INITOBJ.exec(parser))) {
		console.log(init[0])
	}
	
console.log()


	module.exports = myModule
	return module.exports
}

// all the quake 3 parse code looks the same
// @Template
function parse(data) {
	if(!data) {
		return
	}
	if(loop(condition)) {
		body
	}
	return data
}



// To import functions from other places and create 
//   `module` the Module wraps the new module in a 
//   function that gives the code path and filename 
//   context.
// @Template
function wrap() {
	return function (params) {
		body
	}
}

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

function object(init) {
	({
		property: init,
		property2: init2,
	})
}

// TODO: i.e. comments, markdown, attributes (circular)
// @Template
function accumulate(list, item) {
	if(shouldStore) {
		store = list.splice(0)
		return
	} else 
	if(shouldDiscard) {
		list.splice(0)
		return
	}
	list.push(item)
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

// TODO: replace parse context when REPL loads.
//   i.e. parse(node) override


// Try to capture the whole line in between syntax
const COMMENT = /(^|\s+)\/\/(.*)$/
const FUNCNAME = /([a-z]+[a-z-_]*)/
const WORDINESS = /[\s\S]*?\w[\s\S]*?/
// TODO: parse our own file and return;
//   a true quine parser, everything we need to
//   that the template and attribute systems.
// this is so parse will load without error
// CODE REVIEW, don't need `g` because 1 per line?
({
functiondeclaration: (/function\s+[FUNCNAME][\s\n\r]*\(/),
attributes: (/@(\w*)\s*\(*\s*([^,\)\s]*)\s*(,\s*[^,\)\s]*\s*)*\)*/i),
comments: COMMENT,
// does this work on other's code?
objectexpression: (/\(\{\n([WORDINESS]\s*\:\s*[WORDINESS])+\n\}\)/),
logicalexpression: (/\([WORDINESS](&&|\|\|)[WORDINESS]\)/),
variabledeclaration: (/(^|\n|\s+)(let|var|const)[WORDINESS](\n|;)/),
// TODO: unary
booleanexpression: (/\([WORDINESS](==|!=|>|<|>=|<=|===|!==)[WORDINESS]\)/),
// TODO: identifier
identifier: (/((['"])[WORDINESS]\2)/)
})

// TODO: now that I have all by syntax types I can put them
//   into arrays with the same names then continue checking
//   with the parser.

// a basic @File template looks like 
// @Template
({
ignores: attributes[i] 
	&& (attributes[i][1].toLocaleLowerCase() == 'ignore'
	|| attributes[i][1].toLocaleLowerCase() == 'template'),
templates: typeof functiondeclaration[i] != 'undefined',
declarations: typeof objectexpression[i] != 'undefined',
})

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
list: 'attributes',
store: attributes[i] 
// store it back in the list but at the position of the function
// TODO: possible side effect /* @Attrib */ function on the same line
})

function parse(attribute) {
	if(attribute[attribute.length-1]) {
		attribute[attribute.length-1] = attribute[attribute.length-1]
		// clean up extra params matched by attribute
		.split(',').map(function (p) { return p.trim() }).slice(1)
	}
}
