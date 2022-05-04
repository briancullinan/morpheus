
const LONG_LOOPS = 10000


async function runLoop(init, test, update, body, runContext) {
	let result
	if(body.type != 'BlockStatement') {
		throw new Error('ForStatement: Not implemented!')
	}
	let initAndTest = await runThisAndThat(init, test, runContext)
	if(await shouldBubbleOut(runContext)) {
		return
	}

	let testResults = initAndTest[1]
	// TODO: turn off safety feature with an attribute @LongLoops
	let safety = LONG_LOOPS
	for(;testResults && safety > 0; safety--) {
		let result = await runStatement(0, [body], runContext)
		if(runContext.broken) {
			runContext.broken = false
			break
		}
		if(await shouldBubbleOut(runContext)) {
			return
		}
		await runStatement(0, [update], runContext)
		if(await shouldBubbleOut(runContext)) {
			return
		}
		testResults = await runStatement(0, [test], runContext)
		if(await shouldBubbleOut(runContext)) {
			return
		}
	}
	if(await shouldBubbleOut(runContext)) {
		return
	}
// SO I'M NOT A HYPOCRITE LETS PUT SOME REASONABLE BOUNDS!
	if(safety == 0) {
		throw new Error('Long running for loop!')
	}
	return result
}

async function runWhile(AST, runContext) {
  let result
  let safety = LONG_LOOPS
	let testResults
	if(AST.type == 'WhileStatement') {
		let first = true
		while (first || (testResults && --safety > 0)) {
			first = false
			testResults = await runStatement(0, [AST.test], runContext)
			if(await shouldBubbleOut(runContext)) {
				return
			}
			if(!testResults) {
				break
			}
			result = await runStatement(0, [AST.body], runContext)
			if(runContext.broken) {
				runContext.broken = false
				break
			}
			if(await shouldBubbleOut(runContext)) {
				return
			}
		}
	} else 
	if(AST.type == 'DoWhileStatement') {

		do {
			result = await runStatement(0, [AST.body], runContext)
			if(runContext.broken) {
				runContext.broken = false
				break
			}
			if(await shouldBubbleOut(runContext)) {
				return
			}
			testResults = await runStatement(0, [AST.test], runContext)
			if(await shouldBubbleOut(runContext)) {
				return
			}
		} while (testResults && --safety > 0)
	} else {
		throw new Error(AST.type + ': Not implemented!')
	}

	if(await shouldBubbleOut(runContext)) {
		return
	}
	return result
}
