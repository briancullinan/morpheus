// INTENT COMPILER
// a single directive purely-functional programming language
//   that specializes in the manipulation of other programs.
// sure, things like `stack pop` and `convert python to php`
//   are made easy. but let's see what else it does.
/*
THEORY: I've combined an @Attribute system with a code template
system. like `function ${name}(${params}) { return ${values} }`

this will give me the abstraction level that needed to write
the `intent` compiler. a single directive programming language
something like lexer: 
token (
  word ( /\w/g ), 
  symbol ( /[- ,\[\(_,'"\*\&\^ etc/ )
)
node/JS language already comes with most features, the compiler will
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
  // context.subject and context.verbs, context.sentence - everything broken up
  return callee(context, ...nouns)
  // calling the function with the additional context of the
  //   rendered sentence give the function the scope it needs
  //   to make stack changes. so the wordy code can be used
  //   to describe things like `convert framework to framework`.
}
// TODO: If converting a mostly desclarative framework like Github
//     pages, index.yml, the framework conversion actually becomes
//     `convert pages.yml to rest` because we already know what Github
//     is doing on the backend, the backend for it looks like:
//     `grab template then build index` and build index in this
//     context is filled in with the native code for the simple
//     features Github Pages supports like SCSS or w/e their
//     pipeline looks like, maybe it looks like:
//     `fork pages.yml then build then do frontpage-style site-copy`
//     y'all know what I mean by now. those are backend functions already.
// Stacking ideas like this is what I do in my head when planning a project.
//    from my notes I'm stacking the ideas in comments, then I'm building
//    and IDE to demonstrate ideas in a virtual palace.
// Then I'm building a programming language to stack ideas. like I do
//    in my comments. Gee, I wonder if my program could rewrite itself
//    based on my comments? That could be something...


/*

this will form a descriptive tree where basically every `node` in the tree
is it's own seperate program that either does an action or acts on other
tree nodes. 

i.e. adding another level of complexity to software, software
designed to act on it's own stack requires a language complexity that 
simplifies the final language design. 

```
(i.e. intent loop)
  (loop all of, list all of, list everything in, 
    do, do while, for each, )
  (comments are ignored)

translates to:

@Intention(loop)
function translate(context, all, [do while, list ...], everything)
@intention(comment)
function translate() {
  // ignore
}


```

something like that would be a part of the compiler code, to test it
we ask intent to transpiler back to other languages, except where
for(;;) // handles empties
in python however, there is a spread operator
so one of the parts of speech is used as a qualifier
to translate with words back and forth what the spread
operator is doing for loops().
Then other languages can use words to call the specific
features of the spread operator. feaures that are not
built in can be refered to with attributes and a description.
i.e. I mark a project entry with // @NoCollision and the comment
attribute system will work on other comment attribute or the
compiler will emulate a natural program flow provided by the 
framework, like how C# handles @Auth declaratively.
these are attributes being used on compiler features to do translations
like the one above into framework features. this provides some
base features for the language to make itself useful across
other frameworks like Rust is harmonious with native/C.



by adding the complexity of NLP to
the programming language itself, i'm abstracting away the complexity of 
programs that change the structure of other program's stack structure. 
like a quine or a clojure for Occam's razor.

finally, the `intent` language will give me the descriptive power to 
not only write AIs, but also write AI generators, and general AI
generators to solve problems other AIs find. like protein folding for
software would be one generated AI.

My version
of dissent is providing tools to fix the fuck-ups my unindustrious 
government allows people to get away with. I should write a tool
to automatically submit lawsuits for complainers. Literal `complaint`
because the courts can't prioritize working for bankers and debt 
collectors over fixing immigration.

TODO: My version of dissent is destroying Bitcoin and blockchain 
with something even more useful. Michael is a dumbass, learning
Ethereum to run unauthenticated code. My system will allow
anyone to run "authentic ideas" in the cloud.



*/



