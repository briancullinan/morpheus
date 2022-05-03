
function runPrimitive(AST, runContext) {
	if(AST.type == 'Literal') {
		return AST.value
	} else 
	if(AST.type == 'Identifier') {
		if(runContext.localVariables.hasOwnProperty(AST.name)) {
			for(let i = runContext.localDeclarations.length-1; i >= 0; i--) {
				if(runContext.localDeclarations[i].hasOwnProperty(AST.name)) {
					return runContext.localDeclarations[i][AST.name]
				}
			}
		} else {
			throw new Error('Identifier not defined: ' + AST.name)
		}
	} else {
		throw new Error(AST.type + ': Not implemented!')
	}
}

async function runThisAndThat(_this, _that, runContext) {
	let left = await runStatement(0, [_this], runContext)
	if(await shouldBubbleOut(runContext)) {
		return
	}

	let right = await runStatement(0, [_that], runContext)
	if(await shouldBubbleOut(runContext)) {
		return
	}
	return [left, right]
}

async function runUnary(AST, runContext) {
	if(AST.operator == 'void') {
		return void (await runStatement(0, [AST.argument], runContext))
	} else
	if(AST.operator == '!') {
		return !(await runStatement(0, [AST.argument], runContext))
	} else
	if(AST.operator == 'typeof') {
		try {
			let result = await runStatement(0, [AST.argument], runContext)
			return typeof result
		} catch (up) {
			if(up.message.includes('not defined')) {
				return 'undefined'
			} else {
				throw up
			}
		}
	} else
	if(AST.operator == '-') {
		return -(await runStatement(0, [AST.argument], runContext))
	} else {
		debugger
		throw new Error(AST.type + ': Not implemented!')
	}
}

async function runLogical(AST, runContext) {
	// MEANT TO DO THIS SOONER
	if(AST.operator == '&&') {
		let left = await runStatement(0, [AST.left], runContext)
		if(await shouldBubbleOut(runContext)) {
			return
		}
		if(!left) {
			return false
		}
		// left = true

		let right = await runStatement(0, [AST.right], runContext)
		if(await shouldBubbleOut(runContext)) {
			return
		}
		return right
	} else
	if(AST.operator == '||') {
		let left = await runStatement(0, [AST.left], runContext)
		if(await shouldBubbleOut(runContext)) {
			return
		}
		if(left) {
			return true
		}
		// left = false
		let right = await runStatement(0, [AST.right], runContext)
		if(await shouldBubbleOut(runContext)) {
			return
		}

		return right
	} else {
		throw new Error(AST.type + ': Not implemented: ' + AST.operator)
	}

}



// BECAUSE OF THE NATURE OF SECURING EVAL() BY CHROME EXTENSIONS
//   THERE'S LITTLE I CAN DO TO OPTIMIZE THE STYLE OF THIS EVALUATOR
//   EVERY SYMBOL IN JAVASCRIPT HAS TO BE HIT AGAIN.
// HOWEVER, LIKE ANTRL I CAN USE *REFLECTION ON THE GRAMMAR* TO GENERATE AN
//   EVALUATOR IN THE SAME LANGUAGE, JUST LIKE THERE ARE VISITORS AND
//   LISTENERS, I CAN MAKE AN EVALUATOR DO THE SAME THING C DOES WITH
//   ASYNC STATEMENTS IN BETWEEN.
// THIS IS MADE SIMPLER, LIKE JUPYTER KERNELS, ONCE THERE'S AN EVAL()
//   IN ONE FEATURE COMPLETE LANGUAGE, ZMQ CAN TRANSFER FEATURES BETWEEN
//   TWO DIFFERENT FEATURE SETS, A NATIVE KERNEL AND A "META-KERNEL".
// BY ADDING ANTLR/LANGUAGE-SERVER (MICROSOFT LANGUAGE-SERVER WOULD HAVE
//   BEEN THE RIGHT CHOICE IF JUPYTER STARTED TODAY) INTO THE MIX, 
//   I BASICALLY CREATE A "META-KERNEL" IN ANY LANGUAGE. THEN, I USE THAT
//   INTERFACE TO ITERATE AND WRITE THE API TRANSLATION, REQUIRE('FS') ->
//   C# IMPORT FILESYSTEM.
// WHEN THE TRANSLATION IS DONE, I SHOULD BE ABLE TO CONVERT LIKE C2RUST.
//   BETWEEN MORE THAN 2 LANGUAGES (PYTHON -> NODE) USING ONLY META-PROGRAMMING.
//   ONCE THE META-PROGRAMMING INTERFACES ARE COMPLETED, CONSUMPTION CAN BEGIN.
// Obviously, I'm not the only one working on this sort of thing.
async function runBinary(AST, runContext) {
	let thisAndThat = await runThisAndThat(AST.left, AST.right, runContext)
	if(await shouldBubbleOut(runContext)) {
		return
	}
	let left = thisAndThat[0]
	let right = thisAndThat[1]

	// MATHS!
	if(AST.operator == '*') {
		return left * right
	} else
	if(AST.operator == '/') {
		return left / right
	} else
	if(AST.operator == '+') {
		return left + right
	} else
	if(AST.operator == '-') {
		return left - right
	} else
	if(AST.operator == '%') {
		// TODO: cannot modulo a float
		return left % right
	} else
	if(AST.operator == '^') {
		return left ^ right
	} else 
	if(AST.operator == '<=') {
		return left <= right
	} else
	if(AST.operator == '>=') {
		return left >= right
	} else
	if(AST.operator == '!=') {
		return left != right
	} else
	if(AST.operator == '==') {
		return left == right
	} else
	if(AST.operator == '!==') {
		return left !== right
	} else
	if(AST.operator == '===') {
		return left === right
	} else
	if(AST.operator == '<') {
		return left < right
	} else
	if(AST.operator == '>') {
		return left > right
	} else {
		throw new Error(AST.type + ': Not implemented: ' + AST.operator)
	}
}


async function runUpdate(AST, runContext) {
	let argVal = await runStatement(0, [AST.argument], runContext)
	if(await shouldBubbleOut(runContext)) {
		return
	}

	if(AST.operator == '--') {
		await runAssignment(AST.argument, {
      type: 'Literal',
      value: --argVal
    }, runContext)
		if(AST.prefix) {
			return await runStatement(0, [AST.argument], runContext)
		} else {
			return argVal
		}
	} else
	if(AST.operator == '++') {
		await runAssignment(AST.argument, {
      type: 'Literal',
      value: ++argVal
    }, runContext)
		if(AST.prefix) {
			return await runStatement(0, [AST.argument], runContext)
		} else {
			return argVal
		}
	} else {
		throw new Error(AST.type + ': Not implemented!')
	}
	return argVal

}
