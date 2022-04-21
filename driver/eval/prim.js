
function runPrimitive(AST, runContext) {
	if(AST.type == 'Literal') {
		return AST.value
	} else 
	if(AST.type == 'Identifier') {
		if(runContext.localVariables.hasOwnProperty(AST.name)) {
			return runContext.localVariables[AST.name]
		} else
		if(runContext.localFunctions.hasOwnProperty(AST.name)) {
			return runContext.localFunctions[AST.name]
		} else {
			throw new Error('Identifier not defined: ' + AST.name)
		}
	} else {
		throw new Error(AST.type + ': Not implemented!')
	}
}

async function runThisAndThat(_this, _that, runContext) {
	let left = await runStatement(0, [_this], runContext)
	if(!isStillRunning(runContext)) {
		return
	}

	let right = await runStatement(0, [_that], runContext)
	if(!isStillRunning(runContext)) {
		return
	}
	return [left, right]
}


async function runBinary(AST, runContext) {
	// TODO: cannot modulo a float
	let thisAndThat = await runThisAndThat(AST.left, AST.right, runContext)
	if(!isStillRunning(runContext)) {
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
		return left % right
	} else
	if(AST.operator == '^') {
		return left ^ right
	} else
	if(AST.operator == '<') {
		return left < right
	} else
	if(AST.operator == '>') {
		return left > right
	} else
	if(AST.operator == '<=') {
		return left <= right
	} else
	if(AST.operator == '>=') {
		return left >= right
	} else
	// MEANT TO DO THIS SOONER
	if(AST.operator == '&&') {
		return left && right
	} else
	if(AST.operator == '||') {
		return left || right
	} else {
		throw new Error(AST.operator + ': Not implemented!')
	}
}


function runUpdate(AST, runContext) {
	if(!AST.argument || AST.argument.type != 'Identifier') {
		throw new Error(AST.type + ': Not implemented!')
	}
	if(!runContext.localVariables.hasOwnProperty(AST.argument.name)) {
		throw new Error('Identifier not found: ' + AST.argument.name)
	}

	let argVal = runContext.localVariables[AST.argument.name]
	if(AST.operator == '--') {
		if(AST.prefix) {
			argVal = --runContext.localVariables[AST.argument.name]
		} else {
			--runContext.localVariables[AST.argument.name]
		}
	} else
	if(AST.operator == '++') {
		if(AST.prefix) {
			argVal = ++runContext.localVariables[AST.argument.name]
		} else {
			++runContext.localVariables[AST.argument.name]
		}
	} else {
		throw new Error(AST.type + ': Not implemented!')
	}
	let beforeLine = runContext.bubbleLine - 1
	let bubbleColumn = runContext.bubbleColumn
	doAssign(AST.argument.name, beforeLine, bubbleColumn, runContext)
	return argVal

}
