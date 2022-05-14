// Add typing systems to languages that don't have them
// Type-inferencing is nice because it has a side-effect
//   of automatically testing inputs and outputs. 
// C# has type-inferencing when sending a response stream
//   using the web and REST framework. it also infers types
//   through an advanced attribute system.
// express has type-inferencing on send, and time there
//   was an error "received undefined, [URL, DataArray, String]" are valid"
//   that is inferring the type of response you want to send
//   based on the parameter. 
// this is a feature of loosely typed languages because
//   there is no operator overloading in javascript, so
//   any type of object can by passed and then reflection
//   must be used.
// in an optimally code-complete system, where every function
//   is perfectly tested and sanitized, should it matter
//   what the type system is? can't all types be inferred,
//   tested in memory, then implied?
// what if we wound up a testing system for different types
//   before accepting the effects of the REPL? i.e. any
//   asynchronous service calls, must be mocked and 
//   marked @Safe, that way any mistaken code that uses
//   a service call won't accidentally delete /root because
//   our type-system attached to our remote file system 
//   does not allow /root to be deleted and it tries
//   so sandbox the path.
// this would be cool because then I could basically run
//   a -E option, that lists the effects of running a 
//   program but for any program. i.e. a program that
//   writes the files system can be mocked of itself
//   since all test scenarios are defined as init-objects.
//   mocking the filesystem could tell me the effects of
//   running any program, without actually executing the
//   code, mearly evaluating it against mock services.

// type-inferencing would be especially cool in javascript
//   because then i could add operator overloading based on
//   parameter names instead of bullshit other programming
//   languages force you to put in-front of stuff. if you 
//   really wanted a type, there could be an attribute or
//   something like function ({realName: intType}, ...) {}
//   where ObjectExpression is detected by the evaluator
//   inside a parameter definition, and replaced with the
//   appropriate attribute->evaluation instead. 
// this could probably even be done using the reverse of
//   the template.js system using patterns.js, double negative?

// if we can infer our own typings through an attribution 
//   system, perhaps we can infer types in other systems
//   and automatically find bugs and vunerabilities in
//   node_modules, or elsewhere.
// people forget to use the @Auth attribute on ALL the 
//   actions or then entire class/module.

// test on javascript because we should end up with a langauge
//   spec an demo file that looks just like TypeScript


// TODO: test generics system by adding doEval<Template> versus doEval<Code>
//   that distinguishes between eval-ing from a templating system or
//   evaling from other source code, but in `node -e` it emits new code
//   with the types automatically applied, and executing from `tsc -e`
//   it uses the built in module loader that can handle the generics.

// TODO: what other language feature am I missing?
//   adding our own REPL makes any language multi-paradigm like
//   using LINQ in C# code, we can append LINQ to any other langauge.

// TODO: could do the opposite of doEval()
//  template({{{}}}) and detect other language, UNDOEVAL()? undo evil
//   used like REACT-JSX with it's stupid HTML embedding as a PoC.

// TODO: running out of ideas for programming languages

