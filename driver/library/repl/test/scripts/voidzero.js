// A traditional framework is something like this:

// @Service
function service() {
  functionBody
}

// @Main
function action() {
  let result = service()
  send(result)
}

function event() {
  action()
}

// this is not how Void Zero works best. in fact,
//   running this code is itself a demonstration of
//   how void zero works best. from this silly little
//   template, Void Zero injects contexts before the
//   code executes. so this silly template is actually
//   runnable based on the Angular mocking service.

// this code runs because this code buried in another
//   component instructed it to when it applied the 
//   entire program as a template for it's own mock
//   service.

// @Bootstrap - implied by object keys
({
bootstrap: myService,
load: myAction,
init: webEvent(),
})
// ^^^ missing send() is injected by REPL context 
//   (not shown here)

// this is how Void Zero specializes. tools to rewrite
//   and analyze code starts by transforming the context
//   we program in.

// the goal of void zero is to help you never have to
//   write this scaffolding again. the author never 
//   needs to call myAction or myService directly because
//   they are implied by the framework. to finalize
//   this concept, we take our service defined above
//   and inject new inputs and outputs.
// @Quine
({
quine: [__filename, express, json, displayLibrary]
})

// now you should have a json-database service that
//   draws our entire library project structure in 3D.
