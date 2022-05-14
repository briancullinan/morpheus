// If a separate test module is needed, it
//   could only contain (1 - 2) functions with a 
//   declarative list (1..n) of "COMPONENTS" 
//   (not individual functions, entire features / 
//     components are tested and listed in 1 test module, 
//     i.e. ~ 5 - 10 LOC per component, as opposed to per function)
//   with (1 - 2) test environments passed into each component.

// Unit test files becomes a multiplication of 
//   functionality rather that retesting the same branches and primitives.
// TODO: demonstrate seperate unit test file.

// TODO: make a declarative statement that stacks all of our
//   environments and automatically generates mocha style test
//   cases for every branch, except with some of our environments
//   embedded into the code as primitives, I.E Conditional.right
//   so it looks like real tests when managers ask for it because
//   they don't want to take the time to understand code. The only
//   passive aggressively care that you understand your own code.
// Maybe my framework should understand itself and my manager 
//   should either decide to stay out of it or not. Read this
//   like a book ,,|,, 
// GOD BLESS.

// TODO: something like, or whatever mocha documentation says:
function mocha() {
  doTest(function () {

  })

  doSetup()
}

// and
({
doTest: template(randomize(mock([
    'number', 'string', setup(inits)]))),
doSetup: template(mock(database))
})

// should be enough for this output to generate and
//   evaluate tests for our entire base system

function mock() {
  
}

function setup() {

}

function report() {

}

// TODO: make some declarations as template helper functions like the one at the top
({
Node: doRecording,
CallExpression: doLines,
FunctionDeclaration: doTreeshake,
})

// TODO: windings for instanbul code completion utility that acts on branches
({
CallExpression: doBranches,
ReturnStatement: doBranches,
IfStatement: doBranches,
ElseStatement: doBranches,
})
// Results are cached during a program run for later lookup by the reporting utility


// TODO: declare something to run tests on our own test.js


