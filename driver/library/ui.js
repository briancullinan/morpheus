
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
      response = await chrome.tabs.sendMessage(dialog)

    //} catch (e) {
    //  if(e.message.includes(''))
    //}
		if(response && typeof response.result.formData != 'undefined') {
			break
		}
	} while(--tryTimes > 0)
  //chrome.tabs.sendMessage({
  //  accessor: false // hide all dialogs
  //}, function () {})
  return response
}

async function doPageLogin(domain) {
  // LOL! WTF IS THAT? PIE IN SKY!
  let morphKey = chrome.profiles.list() 
  let loginDialog = { 
    accessor: '_enterLogin',
    title: 'Enter password: ' + domain,
  }
  let loginForm = {}
  for(let i = 0; i < morphKey.length; i++) {
    loginForm[morphKey[i]] = 'radio'
  }
  loginForm['user'] = 'text'
  loginForm['pass'] = 'pass'
  loginForm['Save Forever'] = 'submit'
  loginForm['Save Session'] = 'submit'
  loginDialog.form = loginForm
  return await doDialog(loginDialog)
}

async function doSystemLogin() {
  // LOL! WTF IS THAT? PIE IN SKY!
  let morphKey = chrome.profiles.list() 
  let loginDialog = { 
    accessor: '_enterLogin',
    title: 'Enter a system password.',
  }
  let loginForm = {}
  for(let i = 0; i < morphKey.length; i++) {
    loginForm[morphKey[i]] = 'radio'
  }
  loginForm['user'] = 'text'
  loginForm['pass'] = 'pass'
  loginForm['Save Forever'] = 'submit'
  loginForm['Save Session'] = 'submit'
  loginDialog.form = loginForm
  return await doDialog(loginDialog)
}


async function doKeyDialog() {
  let keyCollectDialog = { 
    accessor: '_morpheusKey',
    dragDrop: true,
    text: 'Drop a PEM private/public key pair here.\n'
    + 'This will encrypt any client-stored data,\n'
    + 'So it\'s extra private.\n'
    + 'openssl genrsa -des3 -out private.pem 2048\n'
    + 'openssl rsa -in private.pem -outform PEM -pubout -out public.pem\n'
  }
  return await doDialog(keyCollectDialog)
}
