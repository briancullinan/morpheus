async function runVariable(AST, runContext) {
  if(typeof runContext.localFunctions[AST.id.name] != 'undefined') {
    throw new Error('Function already declared! ' + AST.id.name)
  }
  if(!AST.id || AST.id.type != 'Identifier') {
    throw new Error(AST.type + ': Not implemented!')
  }
  // update client with variable informations
  // KEEP THE SAME BEFORE AND AFTER!
  let beforeLine = runContext.bubbleLine - 1
  let bubbleColumn = runContext.bubbleColumn
  // TODO: add late binding, don't eval until it's accessed
  // TODO: late binding will be needed for observables / change notify
  //   and converting between language features like type interefencing JS -> C#
  //   late binding can trace the type back through the tree to where it was assigned.

  // WOW! IMAGINE THAT! SHOW VARIABLES BEFORE AND AFTER ASSIGNMENT! GOOGLE CHROME DEBUGGER!
  let result 
  if(!AST.init) {
    // TODO: error variable used because initialized
    result = (runContext.localVariables[AST.id.name] = void 0)
  } else {
    result = await runStatement(0, [AST.init], runContext)
    // TODO: ^^ intentionally leak here for reporting, global error handling overriding?
    runContext.localVariables[AST.id.name] = result
    if(await shouldBubbleOut(runContext)) { // bubble up
      return
    }
  }
  return result
}


async function runObject(AST, runContext) {
  let newObject = {}
  for(let k = 0; k < AST.properties.length; k++) {
    let prop = AST.properties[k]
    if(prop.type != 'Property' || prop.key.type != 'Identifier') {
      throw new Error('ObjectExpression: Not implemented!')
    }
    // TODO: add late binding
    newObject[prop.key.name] = await runStatement(0, [prop.value], runContext)
    if(await shouldBubbleOut(runContext)) {
      return
    }
  }
  return newObject
}



// DO VARIABLE REASSIGNMENTS
async function runAssignment(left, right, runContext) {

  if(left.type == 'Literal') {
	// cannot assign value to primitive type
	throw new Error('Cannot override primitive.')
	}

	if (left.type == 'MemberExpression') {
		let parent = await runStatement(0, [left.object], runContext)
		if(await shouldBubbleOut(runContext)) {
			return
		}

		let property
		if(left.property.type == 'Identifier') {
			property = left.property.name
		} else 
		if(left.property.type == 'Literal') {
			property = left.property.value
		} else {
			property = await runStatement(0, [left.property], runContext)
			if(await shouldBubbleOut(runContext)) {
				return
			}
		}

		let result = await runStatement(0, [right], runContext)
		// LEAK ASSIGNMENT FOR GLOBAL DEBUGGING?
		if(await shouldBubbleOut(runContext)) {
			return
		}

		parent[property] = result
		// notify clients
		return result
	} else 
	// TODO: does expression evaluate even if there assignment error?
	// TODO: how does Chome roll this back? Primitives only?
	
	if(left.type == 'Identifier') {
		if(typeof runContext.localFunctions[left.name] != 'undefined') {
			throw new Error('Cannot override function: ' + left.name)
		} else if (!runContext.localVariables.hasOwnProperty(left.name)) {
			// TODO: LAZY, no var, only let
			throw new Error('Variable not defined: ' + left.name)
		} else {
			// WOW! IMAGINE THAT! SHOW VARIABLES BEFORE AND AFTER ASSIGNMENT! GOOGLE CHROME DEBUGGER!
			let result = await runStatement(0, [right], runContext)
			// LEAK ASSIGNMENT FOR GLOBAL DEBUGGING?
			if(await shouldBubbleOut(runContext)) {
				return
			}
			runContext.localVariables[left.name] = result
			return result
		}
	} else {
		throw new Error('AssignmentExpression: Not implemented!')
	}
}

async function runMember(AST, runContext) {
  if(!AST.property) {
    throw new Error('MemberExpression: Not implemented!')
  }
  let property
  if(AST.property.type == 'Literal') {
    property = AST.property.value
  } else
  if(AST.property.type == 'Identifier') {
    if(AST.computed) {
      property = await runStatement(0, [AST.property], runContext)
			if(await shouldBubbleOut(runContext)) {
				return
			}
    } else {
      property = AST.property.name
    }
  } else {
    throw new Error('MemberExpression: Not implemented!')
  }


  let parent = await runStatement(0, [AST.object], runContext)
  if(await shouldBubbleOut(runContext)) {
    return // bubble up
  }

  if(typeof parent == 'object' && parent // BUG: null, whoops
    && typeof parent._accessor != 'undefined') {
    return await parent._accessor(0, AST, AST, runContext)
  }

  if(!parent || (!parent.hasOwnProperty(property)
    && !parent[property])) {
    throw new Error('Member access error: ' + property)
  } else {
    runContext.bubbleMember = parent
    runContext.bubbleProperty = (runContext.bubbleProperty || AST.object.name) + '.' + property
    return parent[property]
  }
}