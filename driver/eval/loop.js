
async function runLoop(init, test, update, body, runContext) {
	let result
	if(body.type != 'BlockStatement') {
		throw new Error('ForStatement: Not implemented!')
	}
	let initAndTest = await runThisAndThat(init, test, runContext)
	if(!isStillRunning(runContext)) {
		return
	}

	let testResults = initAndTest[1]
	// TODO: turn off safety feature with an attribute @LongLoops
	let safety = 10000
	for(;testResults && safety > 0; safety--) {
		let thisAndThat = await runThisAndThat(body, update, runContext)
		if(!isStillRunning(runContext)) {
			return
		}
		result = thisAndThat[0]
		testResults = await runStatement(0, [test], runContext)
		if(!isStillRunning(runContext)) {
			return
		}
	}
	// SO I'M NOT A HYPOCRITE LETS PUT SOME REASONABLE BOUNDS!
	if(safety == 0) {
		throw new Error('Long running for loop!')
	}
	return result
}

async function runWhile(AST, runContext) {
  let result
  let safety = 10000
  do {
    result = await runStatement(0, [AST.body], runContext)
    if(!isStillRunning(runContext)) {
      return
    }
    testResults = await runStatement(0, [AST.test], runContext)
    if(!isStillRunning(runContext)) {
      return
    }
  } while (testResults && --safety > 0)
}
