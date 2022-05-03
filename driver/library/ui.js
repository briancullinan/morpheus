
async function enterPassword(url) {
  let user = await doMorpheusPass() // init for client
	if(!user) {
		throw new Error('Needs Morpheus password.')
	}
}


async function enterLogin(url) {
  let user = await doMorpheusPass() // init for client
	if(!user) {
		throw new Error('Needs Morpheus password.')
	}
}


async function doDialog(dialog) {
// chrome.storage.sync.set({ mytext: txtValue });
	let tryTimes = 15
	let response
	do {
    //try {
      response = await sendMessage(dialog)
    //} catch (e) {
    //  if(e.message.includes(''))
    //}
		if(response && typeof response.responseId != 'undefined') {
			break
		}
	} while(--tryTimes > 0)
  //if(!response) {
      // @Rollback()
  //  debugger
  //}
  return response
}

async function doPageLogin(domain) {
  return await doDialog({ 
    accessor: '_enterLogin',
    title: 'Enter password: ' + domain,
    // LOL! WTF IS THAT? PIE IN SKY! LOVE DEPENDENCY INJECTION.
    profiles: chrome.profiles.list() 
  })
}

async function doSystemLogin() {
  return await doDialog({ 
    accessor: '_enterLogin',
    title: 'Enter a system password.',
    profiles: chrome.profiles.list() 
  })
}


async function doKeyDialog() {
  return await doDialog({
    accessor: '_morpheusKey',
    dragDrop: true,
  })
}


function doDialog(request, reply) {
  let template = Array.from(FS.virtual['library/interactions/dialogs.html']
    .contents).map(function (c) { return String.fromCharCode(c) }).join('')
  let dom = parseDocument(template)
  let dialog = dom.getElementsById(request.accessor)
  if(!dialog) {
    return
  }
  if(request.profiles) { // TODO: templates? Mustache?

  }
	dialog.setAttribute('aria-id', request.responseId)
  request.action = function () {
    // SINK!
    let formResults = collectForm(dialog)
    let encrypted = temporarySessionEncryptor(JSON.stringify(formResults))
    hideDialog(dialog)
    return reply({
      responseId: responseId,
      result: { type: 'string', value: encrypted }
    })
  }
  showDialog(dialog, request)
  return dialog
}


