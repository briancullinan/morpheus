
async function enterPassword(url) {
  await doMorpheusKey() // init for client

}


async function enterLogin(url) {
  await doMorpheusKey() // init for client

}


async function doDialog(dialog) {

	// chrome.storage.sync.set({ mytext: txtValue });
	let tryTimes = 15
	let response
	do {
		response = await chrome.tabs.sendMessage(dialog)
		if(response && response.result) {
			break
		}
	} while(--tryTimes > 0)
  return response
}

async function doLoginDialog() {
  let morphKey = chrome.profiles.list() // LOL! WTF IS THAT? PIE IN SKY!
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
    + 'This will encrypt data on the backend,\n'
    + 'So it\'s extra private.\n'
    + 'openssl genrsa -des3 -out private.pem 2048\n'
    + 'openssl rsa -in private.pem -outform PEM -pubout -out public.pem\n'
  }
  return await doDialog(keyCollectDialog)
}
