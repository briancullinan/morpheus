// something is wrong with repl
//   it's way too slow
//   let's try something new

let programThreads = []
let programResponses = []
let programHeap = []

async function doEval(runContext) {

  // to test this concept, lets use it from the very beginning
  if(typeof runContext.programCallstack == 'undefined') {
    runContext.programCallstack = []
  }
  // convert entire eval repl to a single program stack
  //   this might help with debugging because then it is flat
  //   no branching to await calls
  if(!runContext.body) {
    let bootstrapCode = 'return acorn.parse(\'return acorn.parse("...")\')'
    let program = acorn.parse('2 + a' /* '(function () {\n' + bootstrapCode + '\n})()' */ , 
        {ecmaVersion: 2020, locations: true, onComment: []})
    // convert infix to postfix, in order to simplify processing
    // TODO: I REALLY WISH I COULD VISUALIZE THE DIFFERENCE IN AST-DIRECTIONAL GRAPH
    //   MAYBE ONCE IT'S UP AN RUNNING I CAN USE D3.JS FROM LIBRARY.
    // THE DIFFERENCE BETWEEN LOOKING AT IT TOP DOWN USING POSTFIX SHOULD
    //   PROVIDE SOME CLUES TO SINKS BECAUSE IT PUTS ALL OF THE ENDPOINTS
    //   IN LEAVES INSTEAD OF AT THE BOTTOM OF A TOP DOWN GRAPH, THE LEAVES
    //   TURN IN TO ACTUAL REFERENCES IN CODE, AS OPPOSED TO USE INSTANCES
    // ITS LIKE LOOKING AT CODE LIKE A GARBAGE COLLECTOR INSTEAD OF A SINK.
    //   SHOULD EVEN BE ABLE TO GRAPH OUT OVERRIDING VARIABLE NAMES, COLLISIONS
    //   SCOPE BREAKING WHERE WE ACCIDENTALLY LEAVE A VARIABLE OUTSIDE A SCOPE
    //   BUT DON'T GET AN `ERR`, RAN IN TO THAT WITH EMSCRIPTEN, SOME GLOBALLY 
    //   DEFINED ERR, SO ANY TIME I USE ERR IN MY CODE BY ACCIDENT, IT REFERS 
    //   TO THE WRONG ONE!
    // TODO: HEY CHROME DEBUGGER! I PICK ON THEM A LOT. COULD USE THIS "PROGRAM TREE"
    //   AS A PERMANENT CALL STACK INSTEAD OF TRYING TO LOAD CRAP AND SWITCH THINGS AROUND
    //   USE THE PROGRAM TREE AS A TABLE OF CONTENTS AND HIGHLIGHT THE ROWS THAT ARE IN
    //   IN THE CALL WHEN I CLICK ON IT, THEN USE SOME OTHER INDICATION TO NAVIGATE LINES.
    runContext.body = program.body[0]
  }
  if(typeof runContext.body.length == 'undefined') {
    loadPostfixStack([runContext.body], runContext)
  } else {
    loadPostfixStack(runContext.body, runContext)
  }
  console.log(runContext.programCallstack)
  runContext.programCounter = runContext.programCallstack.length - 1

  // program continues until it is stopped or 
  //   errors or program stack is emptied
  runContext.programTimer = setInterval(
    programCounter.bind(null, runContext), 1000/60)
  return new Promise(function (resolve) {
    programThreads.push(runContext)
    programResponses.push(resolve)
  })
}


function loadPostfixStack(program, runContext) {
  if(typeof program.length != 'number') {
    debugger
    throw new Error('Don\'t know what to do!')
  }
  for(let i = 0; i < program.length; i++) {
    let AST = program[i]
    switch(AST.type) {
      case 'ExpressionStatement':
        loadPostfixStack([AST.expression], runContext)
        runContext.programCallstack.push(AST)
        break
      case 'CallExpression':
        loadPostfixStack(AST.arguments, runContext)
        loadPostfixStack([AST.callee], runContext)
        runContext.programCallstack.push(AST)
        break
      case 'FunctionExpression': // Does param assignment?
        loadPostfixStack(AST.params, runContext)
        loadPostfixStack([AST.body], runContext)
        runContext.programCallstack.push(AST)
        break;
      case 'BlockStatement':
        loadPostfixStack(AST.body, runContext)
        runContext.programCallstack.push(AST)
        break;
      case 'ReturnStatement':
        loadPostfixStack([AST.argument], runContext)
        runContext.programCallstack.push(AST)
        break;
      case 'MemberExpression':
        loadPostfixStack([AST.object], runContext)
        loadPostfixStack([AST.property], runContext)
        runContext.programCallstack.push(AST)
        break;
      case 'BinaryExpression':
        loadPostfixStack([AST.left], runContext)
        loadPostfixStack([AST.right], runContext)
        runContext.programCallstack.push(AST)
      case 'Identifier':
        runContext.programCallstack.push(AST)
        break;
      case 'Literal':
        runContext.programCallstack.push(AST)
        break;
      default:
        // TODO: INTERESTING, AHEAD OF TIME COMPILING? AHEAD OF TIME EVALUATING?
        //   I COULD CHECK A FUNCTION FOR STATIC CALLS AND THEN ASK THE SERVICE
        //   IF THEY'D LIKE TO START-UP AHEAD OF TIME? BY THE TIME MY SCRIPT GETS
        //   THERE IT WILL BE READY?
        debugger
        throw new Error(AST.type + ': Not implemented!')
    }
  }
}


function programCounter(runContext) {
  let result
  if(runContext.programCounter == -1) {
    runContext.ended = true
    runContext.returned = false
    clearInterval(runContext.programTimer)
    let programI = programThreads.indexOf(runContext)
    programThreads.splice(programI, 1)
    let resolve = programResponses.splice(programI, 1)[0]
    return resolve(runContext.bubbleReturn)
  }

  if(runContext.bubbleReturn
    && runContext.bubbleReturn.constructor === Promise) {
    return
  }
  let AST = runContext.programCallstack[runContext.programCounter]
  // TODO: control how many commands it calls every frame?
  switch(AST.type) {
    case 'Identifier':
      runContext.programCounter--
      runContext.bubbleReturn = globalThis[AST.name]
      break
    case 'MemberExpression':
      //runContext.bubbleReturn = globalThis[AST.object][AST.property]
      debugger
      break
    case 'Literal':
      runContext.programCounter--
      runContext.bubbleReturn = AST.value
      break
    case 'CallExpression':
      runContext.bubbleReturn = Promise.all(
        
      )
      runContext.programCounter -= AST.arguments.length
      runContext.programCounter -= 1
      // TODO: create context on stack
      break
    case 'ReturnStatement':
      debugger
      break
    case 'FunctionExpression':
      debugger
      // TODO: return a function?
      break
    case 'ExpressionStatement':
      runContext.programCounter -= 1
      // TODO: make a change like implied return? 
      break
    case 'BlockStatement':
      debugger
      // TODO: copy creation context
      break
    case 'BinaryExpression':
      // TODO: THIS WILL ALLOW ME TO TRANSFORM ARRAY.FILTER() INTO PARALLEL PROMISES?
      runContext.bubbleReturn = Promise.all([
        doEval({
          body: AST.left,
        }),
        doEval({
          body: AST.right,
        })
      ]).then(function (results) {
        debugger
      })
      break
    default: 
      debugger
      throw new Error(AST.type + ': Not implemented!')
  }
  return result
}




