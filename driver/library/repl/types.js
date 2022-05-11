// Add typing systems to languages that don't have them


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

