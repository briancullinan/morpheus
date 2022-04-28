
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

async function runUnary(AST, runContext) {
	if(AST.operator == 'void') {
		return void (await runStatement(0, [AST.argument], runContext))
	} else
	if(AST.operator == '!') {
		return !(await runStatement(0, [AST.argument], runContext))
	} else
	if(AST.operator == 'typeof') {
		if(AST.argument.type == 'Identifier') {
			return typeof (runContext.localFunctions[AST.argument.name] 
					|| runContext.localVariables[AST.argument.name])
		} else if (AST.argument.type == 'MemberExpression') {
			let parent = await runStatement(0, [AST.argument.object], runContext)
			if(!isStillRunning(runContext)) {
				return
			}
			if(AST.argument.property.type == 'Identifier') {
				return typeof (parent[AST.argument.property.name])
			} else {
				let property = await runStatement(0, [AST.argument.property], runContext)
				return typeof parent[property]
			}
		}
	} else {
		throw new Error(AST.type + ': Not implemented!')
	}
}

async function runLogical(AST, runContext) {
	// MEANT TO DO THIS SOONER
	if(AST.operator == '&&') {
		let left = await runStatement(0, [AST.left], runContext)
		if(!isStillRunning(runContext)) {
			return
		}
		if(!left) {
			return false
		}
		// left = true

		let right = await runStatement(0, [AST.right], runContext)
		if(!isStillRunning(runContext)) {
			return
		}
		return right
	} else
	if(AST.operator == '||') {
		let left = await runStatement(0, [AST.left], runContext)
		if(!isStillRunning(runContext)) {
			return
		}
		if(left) {
			return true
		}
		// left = false
		let right = await runStatement(0, [AST.right], runContext)
		if(!isStillRunning(runContext)) {
			return
		}

		return right
	} else {
		throw new Error(AST.type + ': Not implemented: ' + AST.operator)
	}

}


async function runBinary(AST, runContext) {
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
