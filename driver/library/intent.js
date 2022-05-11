// INTENT COMPILER
/*
THEORY: I've combine an @Attribute system with a code template
system. like `function ${name}(${params}) { return ${values} }`

this will give me the abstraction level that need to write
the `intent` compiler. a single directive programming language
something like lexer: 
token (
  word ( /\w/g ), 
  symbol ( /[- ,\[\(_,'"\*\&\^ etc/ )
)
because node/JS already comes with most features, the compiler will
be less than 30 lines of code. a basic consumer for ANTLR, same as
many other projects/transpilers.

the part that will set this compiler apart is that it will require
natural language processing attached to it as a part of the compile
process. this will be an odd relationship to make in the current
design. something like this for every sentence:

*/


// @Emotion(adjectives) // context passed automatically
function translate(context, subject, verbs, nouns) {
  let callee = find(context, subject, ...verbs)
  // context.subject and context.verbs
  return callee(context, ...nouns)
}

/*

this will form a descriptive tree where basically every `node` in the tree
is it's own seperate program that either does an action or acts on other
tree nodes. 

i.e. adding another level of complexity to software, software
designed to act on it's own stack requires a language complexity that 
simplifies the final language design. 

by adding the complexity of NLP to
the programming language itself, i'm abstracting away the complexity of 
programs that change the structure of other program's stack structure. 
like a quine or a clojure for Occam's razor.

finally, the `intent` language will give me the descriptive power to 
not only write AIs, but also write AI generators, and general AI
generators to solve problems other AIs find. like protein folding for
software would be one generated AI.

*/



