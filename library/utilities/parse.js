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



