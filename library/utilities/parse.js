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

// To import functions from other places and create 
//   `module` the Module wraps the new module in a 
//   function that gives the code path and filename 
//   context.
function wrap() {
	return function (params) {
		body
	}
}


// in order to parse our own code files
//   we need a few quines 
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

// that makes it repeatable
console.log()




// all the quake 3 parse code looks the same
// @Template
function parse(data) {
  if(!data) {
    return
  }
  while(condition) {
    body
  }
  return data
}

function object(init) {
  return ({
    property: init,
    property2: init2,
  })
}

// TODO: this probably has to be unit tested
// TODO: move to parse.js and parse out ({}) and try for /** */
// @Init
function parse(code) {	
  // TODO: do using regex and plain text,
  // simple attribute system for bootstrapping?
  let aliases = []
  let attributes = []
  let functions = []
  let codeLines = []
  let ignoring = false
  let commented = false
  for(let i = 0, lines = code.split(/\n/); i < lines.length; ++i) {
    continue
  }
  return {
    aliases,
    functions,
    attributes,
    lines: codeLines
  }


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

}



// TODO: parse our own file and return;
//   a true quine parser, everything we need to
//   that the template and attribute systems.
return;

// a function name parser
({
condition: fnName = (/function\s+([a-z]+[ -~]*)\s*\(/).exec(line),
shouldCrunch: !ignoring && fnName,
crunchData: function (fnName) {
  functions[i] = fnName[1]
  aliases[i] = alias(fnName[1], line)
}
})

// an attribute comment parser
({
condition: attrMatch = (/@(\w*)\s*\(*\s*([^,\)\s]*)\s*(,\s*[^,\)\s]*\s*)*\)*/i).exec(line),
shouldCrunch: function (attrMatch) {
// reasoning, there's only 1 branch, so like 1 or 2 unit tests
  return attrMatch 
      && (attrMatch[1].toLocaleLowerCase() == 'ignore'
      || attrMatch[1].toLocaleLowerCase() == 'template')
      && (ignoring = true)
},
crunchData: function (attrMatch) {
  // reasoning, there's only 1 branch, so 1 extra 
  //   unit test for parameter detection and simplification
  // then I can modify or add another one for more complicated
  //   type-system detection
  if(attrMatch[attrMatch.length-1]) {
    attrMatch[attrMatch.length-1] =
    attrMatch[attrMatch.length-1].split(',')
      .map(function (p) { return p.trim() })
      .slice(1)
  }
  attributes[i] = Array.from(attrMatch)
}
})


// a line-based code file comment parser
({
condition: line = lines[i].replace(/(^|\s+)\/\/(.*)$/, '').trim(),
shouldCrunch: line.length > 0 && !ignoring,
crunchData: codeLines[i] = line,
skipData: ignoring = false,
})
